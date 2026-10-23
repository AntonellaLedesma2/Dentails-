import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import treatmentService from '../../services/treatmentService';
import treatmentCatalogService from '../../services/treatmentCatalogService';
import patientService   from '../../services/patientService';
import userService      from '../../services/userService';
import Button  from '../../components/Button';
import Input   from '../../components/Input';
import Colors  from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';

const ESTADOS = ['planificado', 'en_curso', 'completado', 'cancelado'];
const ESTADO_LABELS = { planificado: 'Planificado', en_curso: 'En curso', completado: 'Completado', cancelado: 'Cancelado' };

export default function TreatmentFormScreen({ route, navigation }) {
  const { mode, treatmentId, patientId: defaultPatientId } = route.params || {};
  const isEdit = mode === 'edit';
  const { user } = useAuth();

  const [form, setForm]     = useState({
    pacienteId: defaultPatientId ? String(defaultPatientId) : '',
    odontologoId: String(user?.id || ''),
    descripcion: '',
    costoTotal: '',
    notas: '',
    estado: 'planificado',
  });
  const [patients, setPatients] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const pats = await patientService.getAll();
        setPatients(pats);
        setCatalog(await treatmentCatalogService.getAll().catch(() => []));
        if (isEdit) {
          const t = await treatmentService.getById(treatmentId);
          setForm({
            pacienteId:   String(t.paciente_id),
            odontologoId: String(t.odontologo_id),
            descripcion:  t.descripcion || '',
            costoTotal:   t.costo_total !== null ? String(t.costo_total) : '',
            notas:        t.notas || '',
            estado:       t.estado || 'planificado',
          });
        }
      } catch {
        Alert.alert('Error', 'No se pudieron cargar los datos');
        navigation.goBack();
      } finally {
        setFetching(false);
      }
    }
    load();
  }, [isEdit, treatmentId]);

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function validate() {
    if (!form.pacienteId)   { Alert.alert('Error', 'Seleccioná un paciente'); return false; }
    if (!form.descripcion.trim()) { Alert.alert('Error', 'Ingresá una descripción'); return false; }
    if (form.costoTotal && isNaN(parseFloat(form.costoTotal))) {
      Alert.alert('Error', 'El costo debe ser un número'); return false;
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
        descripcion:  form.descripcion,
        costoTotal:   form.costoTotal ? parseFloat(form.costoTotal) : null,
        notas:        form.notas || null,
        estado:       form.estado,
      };
      if (isEdit) {
        await treatmentService.update(treatmentId, payload);
        Alert.alert('Éxito', 'Tratamiento actualizado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } else {
        await treatmentService.create(payload);
        Alert.alert('Éxito', 'Tratamiento creado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

        <Text style={styles.sectionLabel}>PACIENTE</Text>
        <View style={styles.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[styles.chip, String(p.id) === form.pacienteId && styles.chipActive]}
                onPress={() => set('pacienteId', String(p.id))}
              >
                <Text style={[styles.chipText, String(p.id) === form.pacienteId && styles.chipTextActive]}>
                  {p.apellido}, {p.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <Text style={styles.sectionLabel}>TRATAMIENTO</Text>
        <View style={styles.section}>
          {!isEdit && catalog.length > 0 && (
            <>
              <Text style={styles.catalogHint}>Elegí una prestación para completar descripción y precio sugerido.</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {catalog.map((item) => (
                  <TouchableOpacity key={item.id} style={[styles.chip, form.descripcion === item.nombre && styles.chipActive]} onPress={() => setForm((f) => ({ ...f, descripcion: item.nombre, costoTotal: String(item.precio) }))}>
                    <Text style={[styles.chipText, form.descripcion === item.nombre && styles.chipTextActive]}>{item.nombre} · Gs. {Number(item.precio).toLocaleString('es-PY')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
          <Input
            label="Descripción *"
            value={form.descripcion}
            onChangeText={(v) => set('descripcion', v)}
            placeholder="Ej: Extracción pieza 14, Limpieza, Ortodoncia..."
          />
          <Input
            label="Costo total (Gs.)"
            value={form.costoTotal}
            onChangeText={(v) => set('costoTotal', v)}
            keyboardType="decimal-pad"
            placeholder="0"
            leftIcon="💲"
          />
          <Input
            label="Notas"
            value={form.notas}
            onChangeText={(v) => set('notas', v)}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70, textAlignVertical: 'top' }}
          />
        </View>

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

        <Button
          title={isEdit ? 'Guardar cambios' : 'Crear tratamiento'}
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
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  catalogHint: { color: Colors.text.secondary, fontSize: 11, marginBottom: 10 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: 8, marginBottom: 4,
  },
  chipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText:       { fontSize: 13, color: Colors.text.secondary },
  chipTextActive: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  submitBtn: { marginTop: 24 },
});
