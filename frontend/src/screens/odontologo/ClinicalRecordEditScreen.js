import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { TrackedScrollView } from '../../components/TrackedScroll';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useAppUi } from '../../context/AppUiContext';
import clinicalRecordService from '../../services/clinicalRecordService';

export default function ClinicalRecordEditScreen({ route, navigation }) {
  const { patientId, record } = route.params;
  const { colors } = useAppUi();
  const [form, setForm] = useState({
    antecedentes: record?.antecedentes || '',
    alergias: record?.alergias || '',
    medicacion: record?.medicacion || '',
    observaciones: record?.observaciones || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  async function save() {
    setSaving(true);
    setError('');
    try {
      await clinicalRecordService.updateRecord(patientId, form);
      navigation.goBack();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudieron guardar los antecedentes.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={[styles.screen, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <TrackedScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.intro, { color: colors.muted }]}>Actualizá la información médica relevante para la atención de este paciente.</Text>
        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Input label="Antecedentes médicos" value={form.antecedentes} onChangeText={(value) => update('antecedentes', value)} multiline numberOfLines={4} style={styles.multiline} />
          <Input label="Alergias" value={form.alergias} onChangeText={(value) => update('alergias', value)} multiline numberOfLines={3} style={styles.multiline} />
          <Input label="Medicación actual" value={form.medicacion} onChangeText={(value) => update('medicacion', value)} multiline numberOfLines={3} style={styles.multiline} />
          <Input label="Observaciones" value={form.observaciones} onChangeText={(value) => update('observaciones', value)} multiline numberOfLines={4} style={styles.multiline} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button title="Cancelar" variant="outline" onPress={() => navigation.goBack()} disabled={saving} style={styles.actionButton} />
            <Button title="Guardar cambios" onPress={save} loading={saving} style={styles.actionButton} />
          </View>
        </View>
      </TrackedScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 18, paddingBottom: 36 },
  intro: { fontSize: 14, lineHeight: 21, marginBottom: 14 },
  formCard: { borderRadius: 16, borderWidth: 1, padding: 18 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  error: { color: '#C53E4B', fontSize: 13, marginBottom: 12 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  actionButton: { minWidth: 130 },
});
