import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, Modal,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import clinicalRecordService from '../../services/clinicalRecordService';
import patientService        from '../../services/patientService';
import Odontogram            from '../../components/Odontogram';
import Card                  from '../../components/Card';
import Button                from '../../components/Button';
import Input                 from '../../components/Input';
import Colors                from '../../constants/colors';

const ESTADOS_DIENTE = ['sano','evaluado','en_curso','completado','extraccion','ausente'];
const ESTADO_LABELS  = {
  sano:'Sano', evaluado:'Evaluado', en_curso:'En curso',
  completado:'Completado', extraccion:'Extracción', ausente:'Ausente',
};

export default function ClinicalRecordScreen({ route, navigation }) {
  const { patientId } = route.params;

  const [patient, setPatient]         = useState(null);
  const [record, setRecord]           = useState(null);
  const [consultas, setConsultas]     = useState([]);
  const [odontograma, setOdontograma] = useState({});
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);
  const [saving, setSaving]           = useState(false);

  // Modal nueva consulta
  const [modalVisible, setModalVisible] = useState(false);
  const [consultaForm, setConsultaForm] = useState({
    diagnostico: '', procedimiento: '', indicaciones: '', proximaCita: '',
  });

  // Modal estado de diente
  const [toothModal, setToothModal]   = useState(false);
  const [selectedTooth, setSelectedTooth] = useState(null);

  const load = useCallback(async () => {
    try {
      const [pat, data] = await Promise.all([
        patientService.getById(patientId),
        clinicalRecordService.getRecord(patientId),
      ]);
      setPatient(pat);
      setRecord(data.record);
      setConsultas(data.consultas || []);
      setOdontograma(data.odontograma || {});
      navigation.setOptions({ title: `${pat.apellido}, ${pat.nombre}` });
    } catch (err) {
      Alert.alert('Error', 'No se pudo cargar la ficha');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => { load(); }, [load]);

  // Tocar un diente → abrir selector de estado
  function handleToothPress(number) {
    setSelectedTooth(number);
    setToothModal(true);
  }

  async function handleSetToothEstado(estado) {
    const newOdo = { ...odontograma, [selectedTooth]: estado };
    setOdontograma(newOdo);
    setToothModal(false);
    try {
      await clinicalRecordService.saveOdontograma(patientId, newOdo);
    } catch {
      Alert.alert('Error', 'No se pudo guardar el odontograma');
    }
  }

  async function handleAddConsulta() {
    if (!consultaForm.diagnostico.trim()) {
      Alert.alert('Error', 'Ingresá al menos un diagnóstico');
      return;
    }
    setSaving(true);
    try {
      await clinicalRecordService.addConsulta(patientId, consultaForm);
      setModalVisible(false);
      setConsultaForm({ diagnostico: '', procedimiento: '', indicaciones: '', proximaCita: '' });
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <>
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      >
        {/* Info del paciente */}
        <View style={s.patientHeader}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{patient?.nombre?.[0]}{patient?.apellido?.[0]}</Text>
          </View>
          <View>
            <Text style={s.patientName}>{patient?.apellido}, {patient?.nombre}</Text>
            {patient?.fecha_nacimiento && (
              <Text style={s.patientMeta}>
                {new Date(patient.fecha_nacimiento).toLocaleDateString('es-AR')}
              </Text>
            )}
          </View>
        </View>

        {/* Antecedentes */}
        <Card title="Antecedentes médicos" style={s.card}>
          {record?.antecedentes
            ? <Text style={s.bodyText}>{record.antecedentes}</Text>
            : <Text style={s.emptyText}>Sin antecedentes registrados</Text>}
          {record?.alergias && (
            <View style={s.alertRow}>
              <Text style={s.alertIcon}>⚠️</Text>
              <Text style={s.alertText}>Alergias: {record.alergias}</Text>
            </View>
          )}
          {record?.medicacion && (
            <Text style={s.bodyText}>💊 Medicación: {record.medicacion}</Text>
          )}
          <Button
            title="Editar antecedentes"
            variant="ghost"
            size="sm"
            style={{ marginTop: 10 }}
            onPress={() => navigation.navigate('ClinicalRecordEdit', { patientId, record })}
          />
        </Card>

        {/* Odontograma */}
        <Text style={s.sectionLabel}>ODONTOGRAMA</Text>
        <Card style={s.card}>
          <Odontogram
            estados={odontograma}
            onToothPress={handleToothPress}
            showDeciduous={false}
          />
          <Text style={s.odoHint}>Tocá un diente para cambiar su estado</Text>
        </Card>

        {/* Historial de consultas */}
        <View style={s.sectionRow}>
          <Text style={s.sectionLabel}>CONSULTAS ({consultas.length})</Text>
          <TouchableOpacity
            style={s.addBtn}
            onPress={() => setModalVisible(true)}
          >
            <Text style={s.addBtnText}>+ Nueva</Text>
          </TouchableOpacity>
        </View>

        {consultas.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyIcon}>📋</Text>
            <Text style={s.emptyText}>Sin consultas registradas</Text>
          </View>
        ) : (
          consultas.map((c) => (
            <View key={c.id} style={s.consultaCard}>
              <View style={s.consultaHeader}>
                <Text style={s.consultaFecha}>
                  {new Date(c.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </Text>
                <Text style={s.consultaOdo}>{c.odontologo_nombre}</Text>
              </View>
              {c.diagnostico   && <Text style={s.consultaField}><Text style={s.fieldLabel}>Diagnóstico: </Text>{c.diagnostico}</Text>}
              {c.procedimiento && <Text style={s.consultaField}><Text style={s.fieldLabel}>Procedimiento: </Text>{c.procedimiento}</Text>}
              {c.indicaciones  && <Text style={s.consultaField}><Text style={s.fieldLabel}>Indicaciones: </Text>{c.indicaciones}</Text>}
              {c.proxima_cita  && (
                <View style={s.proxRow}>
                  <Text style={s.proxIcon}>📅</Text>
                  <Text style={s.proxText}>Próxima cita: {new Date(c.proxima_cita).toLocaleDateString('es-AR')}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal: nueva consulta */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={s.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.modalBox}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Nueva consulta</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={s.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Input label="Diagnóstico *" value={consultaForm.diagnostico}
                onChangeText={(v) => setConsultaForm((f) => ({ ...f, diagnostico: v }))}
                multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: 'top' }} />
              <Input label="Procedimiento" value={consultaForm.procedimiento}
                onChangeText={(v) => setConsultaForm((f) => ({ ...f, procedimiento: v }))}
                multiline numberOfLines={2} style={{ minHeight: 60, textAlignVertical: 'top' }} />
              <Input label="Indicaciones" value={consultaForm.indicaciones}
                onChangeText={(v) => setConsultaForm((f) => ({ ...f, indicaciones: v }))} />
              <Input label="Próxima cita (AAAA-MM-DD)" value={consultaForm.proximaCita}
                onChangeText={(v) => setConsultaForm((f) => ({ ...f, proximaCita: v }))}
                placeholder="2024-04-10" keyboardType="numeric" />
              <Button title="Guardar consulta" onPress={handleAddConsulta} loading={saving} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Modal: cambiar estado de diente */}
      <Modal visible={toothModal} animationType="fade" transparent onRequestClose={() => setToothModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { padding: 20 }]}>
            <Text style={s.modalTitle}>Diente {selectedTooth}</Text>
            <Text style={s.modalSubtitle}>Estado actual: {ESTADO_LABELS[odontograma[selectedTooth] || 'sano']}</Text>
            <View style={s.estadoGrid}>
              {ESTADOS_DIENTE.map((e) => (
                <TouchableOpacity
                  key={e}
                  style={[
                    s.estadoChip,
                    (odontograma[selectedTooth] || 'sano') === e && s.estadoChipActive,
                  ]}
                  onPress={() => handleSetToothEstado(e)}
                >
                  <Text style={[
                    s.estadoChipText,
                    (odontograma[selectedTooth] || 'sano') === e && s.estadoChipTextActive,
                  ]}>
                    {ESTADO_LABELS[e]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Cancelar" variant="outline" onPress={() => setToothModal(false)} style={{ marginTop: 12 }} />
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:   { padding: 16, paddingBottom: 40 },

  patientHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: Colors.card, borderRadius: 14,
    padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.cardBorder, elevation: 2,
  },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary,
  },
  avatarText:   { fontSize: 18, fontWeight: '700', color: Colors.primary },
  patientName:  { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  patientMeta:  { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },

  card: { marginBottom: 16 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label,
    letterSpacing: 1, marginBottom: 8, marginLeft: 2,
  },
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 8,
  },
  addBtn: {
    paddingHorizontal: 14, paddingVertical: 6,
    backgroundColor: Colors.primary, borderRadius: 20,
  },
  addBtnText: { fontSize: 13, color: Colors.white, fontWeight: '600' },

  odoHint: { fontSize: 11, color: Colors.text.label, textAlign: 'center', marginTop: 8 },

  bodyText:  { fontSize: 14, color: Colors.text.primary, lineHeight: 20 },
  emptyText: { fontSize: 13, color: Colors.text.secondary, fontStyle: 'italic' },
  emptyIcon: { fontSize: 36, marginBottom: 8 },
  empty:     { alignItems: 'center', paddingVertical: 24 },

  alertRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8,
    backgroundColor: Colors.errorLight, borderRadius: 8, padding: 8 },
  alertIcon: { fontSize: 16 },
  alertText: { fontSize: 13, color: Colors.error, fontWeight: '600' },

  consultaCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: Colors.cardBorder, elevation: 1,
  },
  consultaHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  consultaFecha:  { fontSize: 13, fontWeight: '700', color: Colors.primary },
  consultaOdo:    { fontSize: 12, color: Colors.text.secondary },
  consultaField:  { fontSize: 13, color: Colors.text.primary, marginBottom: 4, lineHeight: 18 },
  fieldLabel:     { fontWeight: '600' },
  proxRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6,
    backgroundColor: Colors.primaryLight, borderRadius: 8, padding: 6 },
  proxIcon: { fontSize: 14 },
  proxText: { fontSize: 12, color: Colors.primaryDark, fontWeight: '500' },

  // Modals
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '85%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle:    { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  modalSubtitle: { fontSize: 13, color: Colors.text.secondary, marginBottom: 16 },
  modalClose:    { fontSize: 20, color: Colors.text.secondary, padding: 4 },

  estadoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estadoChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  estadoChipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  estadoChipText:       { fontSize: 13, color: Colors.text.secondary },
  estadoChipTextActive: { color: Colors.primary, fontWeight: '600' },
});
