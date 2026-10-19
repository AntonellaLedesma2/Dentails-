import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import appointmentService from '../../services/appointmentService';
import patientService      from '../../services/patientService';
import userService         from '../../services/userService';
import Button    from '../../components/Button';
import Input     from '../../components/Input';
import Colors    from '../../constants/colors';

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

export default function AppointmentFormScreen({ route, navigation }) {
  const { mode, appointmentId, fecha: fechaDefault } = route.params;
  const isEdit = mode === 'edit';

  const [form, setForm]         = useState({ ...EMPTY, fecha: fechaDefault || '' });
  const [patients, setPatients] = useState([]);
  const [odontologos, setOdontologos] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  // Cargar listas de pacientes y odontólogos
  useEffect(() => {
    async function loadData() {
      try {
        const [pats, users] = await Promise.all([
          patientService.getAll(),
          userService.getAll(),
        ]);
        setPatients(pats);
        setOdontologos(users.filter((u) => u.rol === 'odontologo' && u.estado === 'activo'));

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
        }
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los datos');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    }
    loadData();
  }, [isEdit, appointmentId]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
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
    if (!/^\d{2}:\d{2}$/.test(form.hora)) {
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
        hora:         form.hora,
        duracionMin:  form.duracionMin,
        motivo:       form.motivo || null,
        notas:        form.notas  || null,
        estado:       form.estado,
      };

      if (isEdit) {
        await appointmentService.update(appointmentId, payload);
        Alert.alert('Éxito', 'Turno actualizado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await appointmentService.create(payload);
        Alert.alert('Éxito', 'Turno creado correctamente', [{ text: 'OK', onPress: () => navigation.goBack() }]);
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
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        {/* Paciente */}
        <Text style={styles.sectionLabel}>PACIENTE</Text>
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Seleccioná el paciente *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectorScroll}>
            {patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.selectorChip, String(p.id) === form.pacienteId && styles.selectorChipActive]}
                onPress={() => set('pacienteId', String(p.id))}
              >
                <Text style={[styles.selectorText, String(p.id) === form.pacienteId && styles.selectorTextActive]}>
                  {p.apellido}, {p.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Odontólogo */}
        <Text style={styles.sectionLabel}>ODONTÓLOGO</Text>
        <View style={styles.section}>
          <Text style={styles.fieldLabel}>Seleccioná el odontólogo *</Text>
          <View style={styles.chipRow}>
            {odontologos.map((o) => (
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
          </View>
        </View>

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
            onChangeText={(v) => set('hora', v)}
            placeholder="09:00"
            keyboardType="numeric"
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
        {isEdit && (
          <>
            <Text style={styles.sectionLabel}>ESTADO</Text>
            <View style={styles.section}>
              <View style={styles.chipRow}>
                {ESTADOS.map((e) => (
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: Colors.background },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, paddingBottom: 40 },

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
