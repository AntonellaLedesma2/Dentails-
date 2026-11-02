import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { TrackedScrollView } from '../../components/TrackedScroll';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { useAuth } from '../../context/AuthContext';
import { useAppUi } from '../../context/AppUiContext';

export default function PatientRegisterScreen() {
  const { registerPatient } = useAuth();
  const { colors } = useAppUi();
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', telefono: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function set(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit() {
    setError('');
    if (!form.nombre.trim() || !form.apellido.trim()) { setError('Completá tu nombre y apellido.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) { setError('Ingresá un correo válido.'); return; }
    if (form.password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres.'); return; }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return; }

    Keyboard.dismiss();
    setLoading(true);
    try {
      await registerPatient({
        nombre: form.nombre.trim(), apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase(), telefono: form.telefono.trim() || undefined,
        password: form.password,
      });
    } catch (err) {
      setError(err.response?.data?.message || (err.request
        ? 'No se pudo conectar con el servidor. Verificá que el backend esté iniciado y que la URL de la API sea correcta.'
        : 'No se pudo crear la cuenta. Revisá los datos e intentá de nuevo.'));
    } finally { setLoading(false); }
  }

  return (
    <KeyboardAvoidingView style={[styles.flex, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TrackedScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="always" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.text }]}>Crear cuenta de paciente</Text>
          <Text style={[styles.subtitle, { color: colors.muted }]}>Registrate para solicitar una cita odontológica.</Text>
          <Input label="Nombre *" value={form.nombre} onChangeText={(value) => set('nombre', value)} autoCapitalize="words" returnKeyType="next" showFocusStyle={false} />
          <Input label="Apellido *" value={form.apellido} onChangeText={(value) => set('apellido', value)} autoCapitalize="words" returnKeyType="next" showFocusStyle={false} />
          <Input label="Correo electrónico *" value={form.correo} onChangeText={(value) => set('correo', value)} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" showFocusStyle={false} />
          <Input label="Teléfono (opcional)" value={form.telefono} onChangeText={(value) => set('telefono', value)} keyboardType="phone-pad" returnKeyType="next" showFocusStyle={false} />
          <Input label="Contraseña *" value={form.password} onChangeText={(value) => set('password', value)} secureTextEntry autoComplete="new-password" returnKeyType="next" showFocusStyle={false} />
          <Input label="Repetir contraseña *" value={form.confirmPassword} onChangeText={(value) => set('confirmPassword', value)} secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={submit} showFocusStyle={false} />
          {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
          <Button title="Crear cuenta y continuar" onPress={submit} loading={loading} size="lg" style={styles.submit} />
          <Text style={[styles.note, { color: colors.muted }]}>La cuenta se crea como paciente y solo permite solicitar citas.</Text>
        </View>
      </TrackedScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, content: { flexGrow: 1, justifyContent: 'center', padding: 20, paddingBottom: 36 },
  card: { width: '100%', maxWidth: 520, alignSelf: 'center', padding: 24, borderWidth: 1, borderRadius: 18, gap: 8 },
  title: { fontSize: 23, fontWeight: '800' }, subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  error: { color: '#C62835', fontSize: 13, lineHeight: 19 }, submit: { marginTop: 8 },
  note: { fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 8 },
});
