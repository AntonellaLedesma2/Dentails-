import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import patientService    from '../../services/patientService';
import Button            from '../../components/Button';
import Input             from '../../components/Input';
import ObraSocialPicker  from '../../components/ObraSocialPicker';
import Colors            from '../../constants/colors';

const SEXO_OPTIONS = [
  { value: 'masculino', label: 'Masculino' },
  { value: 'femenino',  label: 'Femenino'  },
  { value: 'otro',      label: 'Otro'       },
];

const EMPTY_FORM = {
  nombre: '', apellido: '', dni: '', fechaNacimiento: '', sexo: '',
  telefono: '', correo: '', direccion: '', obraSocial: '', nroAfiliado: '', observaciones: '',
};

export default function PatientFormScreen({ route, navigation }) {
  const { mode = 'create', patientId } = route?.params || {}; // mode: 'create' | 'edit'
  const isEdit = mode === 'edit';

  const [form, setForm]     = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    patientService.getById(patientId).then((p) => {
      setForm({
        nombre:          p.nombre          || '',
        apellido:        p.apellido        || '',
        dni:             p.dni             || '',
        fechaNacimiento: p.fecha_nacimiento ? p.fecha_nacimiento.substring(0, 10) : '',
        sexo:            p.sexo            || '',
        telefono:        p.telefono        || '',
        correo:          p.correo          || '',
        direccion:       p.direccion       || '',
        obraSocial:      p.obra_social     || '',
        nroAfiliado:     p.nro_afiliado    || '',
        observaciones:   p.observaciones   || '',
      });
      setFetching(false);
    }).catch(() => {
      setFormError('No se pudo cargar el paciente. Volvé a la lista e intentá nuevamente.');
      navigation.goBack();
    });
}, [isEdit, patientId, navigation]);
  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
    setFormError('');
  }

  function validate() {
    const e = {};
    if (!form.nombre.trim())   e.nombre   = 'Nombre requerido';
    if (!form.apellido.trim()) e.apellido = 'Apellido requerido';
    if (form.correo && !/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'Correo inválido';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit() {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEdit) {
        await patientService.update(patientId, form);
        navigation.goBack();
      } else {
        const res = await patientService.create(form);
        navigation.replace('PatientDetail', { patientId: res.patientId });
      }
    } catch (err) {
      setFormError(err.response?.data?.message || (err.request
        ? 'No se pudo conectar con el servidor. Revisá que esté iniciado e intentá otra vez.'
        : 'No se pudo guardar el paciente. Revisá los datos e intentá otra vez.'));
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="always" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>

        <View style={styles.pageHeading}>
          <Text style={styles.pageTitle}>{isEdit ? 'Editar paciente' : 'Nuevo paciente'}</Text>
          <Text style={styles.pageSubtitle}>{isEdit ? 'Actualizá los datos de la ficha del paciente.' : 'Completá los datos para crear una ficha.'}</Text>
        </View>
        {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}

        <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>
        <View style={styles.section}>
          <Input label="Nombre *"   value={form.nombre}   onChangeText={(v) => set('nombre', v)}   error={errors.nombre} />
          <Input label="Apellido *" value={form.apellido} onChangeText={(v) => set('apellido', v)} error={errors.apellido} />
          <Input label="DNI"        value={form.dni}      onChangeText={(v) => set('dni', v)}       keyboardType="numeric" />
          <Input
            label="Fecha de nacimiento (AAAA-MM-DD)"
            value={form.fechaNacimiento}
            onChangeText={(v) => set('fechaNacimiento', v)}
            placeholder="1990-01-31"
            keyboardType="numeric"
          />

          {/* Selector de sexo */}
          <Text style={styles.fieldLabel}>Sexo</Text>
          <View style={styles.chipRow}>
            {SEXO_OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.chip, form.sexo === opt.value && styles.chipActive]}
                onPress={() => set('sexo', form.sexo === opt.value ? '' : opt.value)}
              >
                <Text style={[styles.chipText, form.sexo === opt.value && styles.chipTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionLabel}>CONTACTO</Text>
        <View style={styles.section}>
          <Input label="Teléfono"  value={form.telefono} onChangeText={(v) => set('telefono', v)} keyboardType="phone-pad" leftIcon="📞" />
          <Input label="Correo"    value={form.correo}   onChangeText={(v) => set('correo', v)}   error={errors.correo} leftIcon="✉️" keyboardType="email-address" autoCapitalize="none" />
          <Input label="Dirección" value={form.direccion} onChangeText={(v) => set('direccion', v)} leftIcon="📍" />
        </View>

        <Text style={styles.sectionLabel}>OBRA SOCIAL</Text>
        <View style={styles.section}>
          <ObraSocialPicker
            label="Obra social"
            value={form.obraSocial}
            onChange={(v) => set('obraSocial', v)}
          />
          <Input label="Nro. afiliado" value={form.nroAfiliado} onChangeText={(v) => set('nroAfiliado', v)} />
        </View>

        <Text style={styles.sectionLabel}>OBSERVACIONES</Text>
        <View style={styles.section}>
          <Input
            label="Observaciones administrativas"
            value={form.observaciones}
            onChangeText={(v) => set('observaciones', v)}
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
        </View>

        <Button
          title={isEdit ? 'Guardar cambios' : 'Registrar paciente'}
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
  flex:      { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: 20, paddingBottom: 40, flexGrow: 1 },
  pageHeading: { marginBottom: 2, marginTop: 2 },
  pageTitle: { color: Colors.text.primary, fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  pageSubtitle: { color: Colors.text.secondary, fontSize: 13, lineHeight: 19, marginTop: 4 },
  formError: { color: '#B42332', backgroundColor: '#FDEBEC', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19 },

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
    gap: 0,
  },

  fieldLabel: {
    fontSize: 13, fontWeight: '600', color: Colors.text.secondary,
    marginBottom: 8, letterSpacing: 0.3,
  },
  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  chipActive:     { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  chipText:       { fontSize: 13, color: Colors.text.secondary },
  chipTextActive: { fontSize: 13, color: Colors.primary, fontWeight: '600' },

  submitBtn: { marginTop: 24 },
});
