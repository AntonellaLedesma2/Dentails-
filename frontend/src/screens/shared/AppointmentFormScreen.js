import React, { useState, useEffect } from 'react';
import { TrackedScrollView } from '../../components/TrackedScroll';
import {
  View, Text, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import appointmentService from '../../services/appointmentService';
import patientService      from '../../services/patientService';
import userService         from '../../services/userService';
import Button    from '../../components/Button';
import Input     from '../../components/Input';
import Colors    from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { useAppUi } from '../../context/AppUiContext';

const ESTADOS = ['pendiente', 'confirmado', 'reprogramado', 'cancelado', 'realizado'];
const ESTADO_LABELS = {
  pendiente: 'Pendiente', confirmado: 'Confirmado',
  reprogramado: 'Reprogramado', cancelado: 'Cancelado', realizado: 'Realizado',
};
const DURACIONES = [15, 20, 30, 45, 60, 90];

const EMPTY = {
  pacienteId: '', odontologoId: '', fecha: '', hora: '',
  duracionMin: 30, motivo: '', notas: '', estado: 'pendiente',
};

function formatHoraInput(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)}:${digits.slice(2)}` : digits;
}

export default function AppointmentFormScreen({ route, navigation }) {
  const { user } = useAuth();
  const { colors } = useAppUi();
  const { mode = 'create', appointmentId, fecha: fechaDefault } = route?.params || {};
  const isEdit = mode === 'edit';
  const isDentist = user?.rol === ROLES.ODONTOLOGO;

  const [form, setForm]         = useState({ ...EMPTY, fecha: fechaDefault || '' });
  const [patients, setPatients] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [patientSearch, setPatientSearch] = useState('');
  const [patientResults, setPatientResults] = useState([]);
  const [patientSearchLoading, setPatientSearchLoading] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState('');
  const [doctorSearch, setDoctorSearch] = useState('');
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [initialEstado, setInitialEstado] = useState('pendiente');
  const normalizedDoctorQuery = doctorSearch.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filteredDentists = odontologos.filter((doctor) =>
    `${doctor.nombre} ${doctor.apellido}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(normalizedDoctorQuery)
  );

  // Cargar listas de pacientes y odontólogos
  useEffect(() => {
    async function loadData() {
      try {
        const [pats, users] = await Promise.all([
          patientService.getAll(),
          isDentist ? Promise.resolve([user]) : userService.getDentists(),
        ]);
        setPatients(pats);
        setAllPatients(pats);
        setOdontologos(users);
        if (isDentist && !isEdit) setForm((current) => ({ ...current, odontologoId: String(user.id) }));

        if (isEdit) {
          const appt = await appointmentService.getById(appointmentId);
          setForm({
            pacienteId:   String(appt.paciente_id),
            odontologoId: String(appt.odontologo_id),
            fecha:        appt.fecha?.substring(0, 10) || '',
            hora:         appt.hora?.substring(0, 5)   || '',
            duracionMin:  appt.duracion_min || 30,
            motivo:       appt.motivo   || '',
            notas:        appt.notas    || '',
            estado:       appt.estado   || 'pendiente',
          });
          setInitialEstado(appt.estado || 'pendiente');
        }
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los datos');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [isEdit, appointmentId, navigation, isDentist, user]);

  useEffect(() => {
    const query = patientSearch.trim();
    if (!query) return undefined;
    let active = true;
    const timer = setTimeout(async () => {
      setPatientSearchLoading(true);
      setPatientSearchError('');
      try {
        const matches = await patientService.getAll(query);
        if (active) setPatientResults(matches);
      } catch (err) {
        if (active) setPatientSearchError(err.response?.data?.message || 'No se pudo buscar pacientes.');
      } finally {
        if (active) setPatientSearchLoading(false);
      }
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [patientSearch]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePatientSearch(value) {
    setPatientSearch(value);
    setPatientResults([]);
    if (!value.trim()) {
      setPatientSearchError('');
    }
  }

  function validate() {
    if (!form.pacienteId)   { Alert.alert('Error', 'Seleccioná un paciente');     return false; }
    if (!form.odontologoId) { Alert.alert('Error', 'Seleccioná un odontólogo');   return false; }
    if (!form.fecha)        { Alert.alert('Error', 'Ingresá la fecha');            return false; }
    if (!form.hora)         { Alert.alert('Error', 'Ingresá la hora');             return false; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.fecha)) {
      Alert.alert('Error', 'La fecha debe tener formato AAAA-MM-DD');
      return false;
    }
    const normalizedTime = formatHoraInput(form.hora);
    const timeMatch = normalizedTime.match(/^(\d{2}):(\d{2})$/);
    if (!timeMatch || Number(timeMatch[1]) > 23 || Number(timeMatch[2]) > 59) {
      Alert.alert('Error', 'La hora debe tener formato HH:MM');
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      const payload = {
        pacienteId:   parseInt(form.pacienteId),
        odontologoId: parseInt(form.odontologoId),
        fecha:        form.fecha,
        hora:         formatHoraInput(form.hora),
        duracionMin:  form.duracionMin,
        motivo:       form.motivo || null,
        notas:        form.notas  || null,
      };

      if (isEdit) {
        await appointmentService.update(appointmentId, payload);
        if (initialEstado !== form.estado) await appointmentService.changeEstado(appointmentId, form.estado);
        navigation.goBack();
      } else {
        await appointmentService.create({ ...payload, estado: isDentist ? 'pendiente' : form.estado });
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo guardar el turno');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TrackedScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <TouchableOpacity style={styles.backRow} onPress={() => navigation.goBack()} accessibilityRole="button" accessibilityLabel="Volver atrás">
          <Text style={[styles.backText, { color: colors.primary }]}>‹  Volver</Text>
        </TouchableOpacity>

        {/* Paciente */}
        <Text style={styles.sectionLabel}>PACIENTE</Text>
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Buscá por nombre, apellido, teléfono, DNI, correo u otro dato *</Text>
          <Input value={patientSearch} onChangeText={handlePatientSearch} placeholder="Ej: Ana, 0981..., DNI, obra social..." leftIcon="🔎" autoCapitalize="none" />
          {patientSearchLoading && <ActivityIndicator color={colors.primary} style={styles.searchSpinner} />}
          {patientSearchError ? <Text style={styles.searchError}>{patientSearchError}</Text> : null}
          {!!patientSearch.trim() && !patientSearchLoading && !patientSearchError && patientResults.length === 0 && <Text style={styles.emptyMsg}>No se encontraron pacientes con esos datos.</Text>}
          {!!patientSearch.trim() && patientResults.slice(0, 8).map((p) => (
            <TouchableOpacity key={p.id} style={[styles.searchResult, { backgroundColor: colors.background, borderColor: String(p.id) === form.pacienteId ? colors.primary : colors.border }]} onPress={() => { set('pacienteId', String(p.id)); setPatientSearch(p.nombre + ' ' + p.apellido); }}>
              <View style={styles.resultCopy}>
                <Text style={[styles.resultName, { color: colors.text }]}>{p.apellido}, {p.nombre}</Text>
                <Text style={[styles.resultMeta, { color: colors.muted }]}>{[p.telefono, p.dni, p.correo, p.obra_social].filter(Boolean).join(' · ') || 'Sin datos de contacto adicionales'}</Text>
              </View>
              <Text style={[styles.resultCheck, { color: colors.primary }]}>{String(p.id) === form.pacienteId ? '✓' : '+'}</Text>
            </TouchableOpacity>
          ))}
          {!!form.pacienteId && <Text style={[styles.selectedSummary, { color: colors.primary }]}>{(() => { const selected = allPatients.find((p) => String(p.id) === form.pacienteId) || patientResults.find((p) => String(p.id) === form.pacienteId); return selected ? `Seleccionado: ${selected.apellido}, ${selected.nombre}` : 'Paciente seleccionado'; })()}</Text>}
          {patients.length === 0 && <Text style={styles.emptyMsg}>No hay pacientes activos. Creá el paciente antes de agendar.</Text>}
        </View>

        {/* Odontólogo */}
        {!isDentist && <Text style={styles.sectionLabel}>ODONTÓLOGO</Text>}
        {!isDentist &&
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Buscá y seleccioná el odontólogo *</Text>
          <Input value={doctorSearch} onChangeText={setDoctorSearch} placeholder="Nombre o apellido del odontólogo" leftIcon="🔎" autoCapitalize="none" />
          <View style={styles.chipRow}>
            {filteredDentists.map((o) => (
              <TouchableOpacity
                key={o.id}
                style={[styles.chip, String(o.id) === form.odontologoId && styles.chipActive]}
                onPress={() => set('odontologoId', String(o.id))}
              >
                <Text style={[styles.chipText, String(o.id) === form.odontologoId && styles.chipTextActive]}>
                  Dr/a. {o.nombre} {o.apellido}
                </Text>
              </TouchableOpacity>
            ))}
            {odontologos.length === 0 && (
              <Text style={styles.emptyMsg}>No hay odontólogos activos</Text>
            )}
            {odontologos.length > 0 && filteredDentists.length === 0 && (
              <Text style={styles.emptyMsg}>No se encontraron odontólogos con ese nombre.</Text>
            )}
          </View>
        </View>}

        {/* Fecha y hora */}
        <Text style={styles.sectionLabel}>FECHA Y HORA</Text>
        <View style={styles.section}>
          <Input
            label="Fecha * (AAAA-MM-DD)"
            value={form.fecha}
            onChangeText={(v) => set('fecha', v)}
            placeholder="2024-03-15"
            keyboardType="numeric"
          />
          <Input
            label="Hora * (HH:MM)"
            value={form.hora}
            onChangeText={(v) => set('hora', formatHoraInput(v))}
            placeholder="0900"
            keyboardType="numeric"
            hint="Ingresá 4 números, por ejemplo 0900; se mostrará 09:00."
          />

          <Text style={styles.fieldLabel}>Duración</Text>
          <View style={styles.chipRow}>
            {DURACIONES.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.chip, form.duracionMin === d && styles.chipActive]}
                onPress={() => set('duracionMin', d)}
              >
                <Text style={[styles.chipText, form.duracionMin === d && styles.chipTextActive]}>
                  {d}m
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Motivo y notas */}
        <Text style={styles.sectionLabel}>DETALLES</Text>
        <View style={styles.section}>
          <Input
            label="Motivo de la consulta"
            value={form.motivo}
            onChangeText={(v) => set('motivo', v)}
            placeholder="Ej: Control, limpieza, dolor..."
          />
          <Input
            label="Notas internas"
            value={form.notas}
            onChangeText={(v) => set('notas', v)}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70, textAlignVertical: 'top' }}
          />
        </View>

        {/* Estado (solo edición) */}
        {isEdit && user?.rol === ROLES.ADMINISTRADOR && (
          <>
            <Text style={styles.sectionLabel}>ESTADO</Text>
            <View style={styles.section}>
              <View style={styles.chipRow}>
                {ESTADOS.filter((e) => user?.rol !== ROLES.RECEPCION || e !== 'realizado').map((e) => (
                  <TouchableOpacity
                    key={e}
                    style={[styles.chip, form.estado === e && styles.chipActive]}
                    onPress={() => set('estado', e)}
                  >
                    <Text style={[styles.chipText, form.estado === e && styles.chipTextActive]}>
                      {ESTADO_LABELS[e]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        <Button
          title={isEdit ? 'Guardar cambios' : 'Crear turno'}
          onPress={handleSubmit}
          loading={loading}
          size="lg"
          style={styles.submitBtn}
        />
      </TrackedScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: Colors.background },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 40 },
  backRow: { alignSelf: 'flex-start', paddingVertical: 8, paddingRight: 14 },
  backText: { fontSize: 16, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label,
    letterSpacing: 1, marginBottom: 8, marginTop: 16, marginLeft: 2,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.text.secondary,
    marginBottom: 8, letterSpacing: 0.3,
  },
  selectorScroll: { marginBottom: 4 },
  selectorChip: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 8, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
    marginRight: 8,
  },
  selectorChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  selectorText:       { fontSize: 13, color: Colors.text.secondary },
  selectorTextActive: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  searchResult: { minHeight: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderWidth: 1, borderRadius: 10, marginBottom: 7 },
  resultCopy: { flex: 1, paddingRight: 8 },
  resultName: { fontSize: 14, fontWeight: '700' },
  resultMeta: { fontSize: 11, marginTop: 3 },
  resultCheck: { fontSize: 18, fontWeight: '800', paddingHorizontal: 5 },
  selectedSummary: { fontSize: 12, fontWeight: '700', marginTop: 6 },
  searchSpinner: { marginVertical: 10 },
  searchError: { color: Colors.error, fontSize: 12, marginBottom: 8 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
  },
  chipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText:       { fontSize: 13, color: Colors.text.secondary },
  chipTextActive: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  emptyMsg:   { fontSize: 13, color: Colors.text.secondary },
  submitBtn:  { marginTop: 24 },
});
