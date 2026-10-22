import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import paymentService   from '../../services/paymentService';
import patientService   from '../../services/patientService';
import treatmentService from '../../services/treatmentService';
import Button  from '../../components/Button';
import Input   from '../../components/Input';
import Colors  from '../../constants/colors';

const METODOS = [
  { value: 'efectivo',        label: '💵 Efectivo' },
  { value: 'tarjeta_debito',  label: '💳 Débito' },
  { value: 'tarjeta_credito', label: '💳 Crédito' },
  { value: 'transferencia',   label: '🏦 Transferencia' },
  { value: 'obra_social',     label: '🏥 Obra social' },
];

export default function NewPaymentScreen({ route, navigation }) {
  const { odontologoId, pacienteIdDefault } = route.params || {};

  const [form, setForm]         = useState({
    pacienteId:    pacienteIdDefault ? String(pacienteIdDefault) : '',
    tratamientoId: '',
    importe:       '',
    metodo:        'efectivo',
    referencia:    '',
  });
  const [patients,    setPatients]    = useState([]);
  const [treatments,  setTreatments]  = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [fetching,    setFetching]    = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const pats = await patientService.getAll();
        setPatients(pats);
        if (pacienteIdDefault) {
          const treats = await treatmentService.getAll({
            paciente_id:   pacienteIdDefault,
            odontologo_id: odontologoId,
          });
          setTreatments(treats);
        }
      } catch {}
      finally { setFetching(false); }
    }
    load();
  }, []);

  async function loadTreatments(pacienteId) {
    try {
      const treats = await treatmentService.getAll({ paciente_id: pacienteId, odontologo_id: odontologoId });
      setTreatments(treats);
    } catch {}
  }

  function set(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  async function handleSubmit() {
    if (!form.pacienteId) { Alert.alert('Error', 'Seleccioná un paciente'); return; }
    if (!form.importe || isNaN(parseFloat(form.importe))) {
      Alert.alert('Error', 'Ingresá un importe válido'); return;
    }
    setLoading(true);
    try {
      await paymentService.create({
        pacienteId:    parseInt(form.pacienteId),
        tratamientoId: form.tratamientoId ? parseInt(form.tratamientoId) : null,
        importe:       parseFloat(form.importe),
        metodo:        form.metodo,
        referencia:    form.referencia || null,
      });
      Alert.alert('Éxito', 'Pago registrado', [{ text: 'OK', onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo registrar el pago');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.container} keyboardShouldPersistTaps="handled">

        <Text style={s.sectionLabel}>PACIENTE</Text>
        <View style={s.section}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {patients.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={[s.chip, String(p.id) === form.pacienteId && s.chipActive]}
                onPress={() => {
                  set('pacienteId', String(p.id));
                  set('tratamientoId', '');
                  loadTreatments(p.id);
                }}
              >
                <Text style={[s.chipText, String(p.id) === form.pacienteId && s.chipTextActive]}>
                  {p.apellido}, {p.nombre}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {treatments.length > 0 && (
          <>
            <Text style={s.sectionLabel}>TRATAMIENTO (opcional)</Text>
            <View style={s.section}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <TouchableOpacity
                  style={[s.chip, !form.tratamientoId && s.chipActive]}
                  onPress={() => set('tratamientoId', '')}
                >
                  <Text style={[s.chipText, !form.tratamientoId && s.chipTextActive]}>Sin asociar</Text>
                </TouchableOpacity>
                {treatments.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[s.chip, String(t.id) === form.tratamientoId && s.chipActive]}
                    onPress={() => {
                      set('tratamientoId', String(t.id));
                      if (t.costo_total) set('importe', String(t.costo_total));
                    }}
                  >
                    <Text style={[s.chipText, String(t.id) === form.tratamientoId && s.chipTextActive]}>
                      {t.descripcion} {t.costo_total ? `($${t.costo_total})` : ''}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </>
        )}

        <Text style={s.sectionLabel}>PAGO</Text>
        <View style={s.section}>
          <Input
            label="Importe * ($)"
            value={form.importe}
            onChangeText={(v) => set('importe', v)}
            keyboardType="decimal-pad"
            leftIcon="💲"
            placeholder="0.00"
          />
          <Text style={s.fieldLabel}>Método de pago</Text>
          <View style={s.chipRow}>
            {METODOS.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[s.chip, form.metodo === m.value && s.chipActive]}
                onPress={() => set('metodo', m.value)}
              >
                <Text style={[s.chipText, form.metodo === m.value && s.chipTextActive]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Input
            label="Referencia / N° comprobante"
            value={form.referencia}
            onChangeText={(v) => set('referencia', v)}
            placeholder="Opcional"
          />
        </View>

        <Button title="Registrar pago" onPress={handleSubmit} loading={loading} size="lg" style={s.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
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
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.secondary, marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white,
    marginRight: 6, marginBottom: 4,
  },
  chipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText:       { fontSize: 13, color: Colors.text.secondary },
  chipTextActive: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  btn: { marginTop: 24 },
});
