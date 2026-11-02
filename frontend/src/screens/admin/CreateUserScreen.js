import React, { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { TrackedScrollView } from '../../components/TrackedScroll';
import userService from '../../services/userService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { useAppUi } from '../../context/AppUiContext';

const roleOptions = [
  { value: ROLES.ADMINISTRADOR, icon: '🛡️', description: 'Gestiona usuarios y configuración.' },
  { value: ROLES.RECEPCION, icon: '📅', description: 'Administra agenda y recepción.' },
  { value: ROLES.ODONTOLOGO, icon: '🦷', description: 'Accede a fichas y atención clínica.' },
  { value: ROLES.USUARIO, icon: '👤', description: 'Puede solicitar citas odontológicas.' },
];

export default function CreateUserScreen({ navigation }) {
  const { colors } = useAppUi();
  const [form, setForm] = useState({ nombre: '', apellido: '', correo: '', password: '', rol: ROLES.USUARIO });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  function set(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setServerError('');
  }

  function validate() {
    const next = {};
    if (!form.nombre.trim()) next.nombre = 'Ingresá el nombre.';
    if (!form.apellido.trim()) next.apellido = 'Ingresá el apellido.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo.trim())) next.correo = 'Ingresá un correo válido.';
    if (form.password.length < 8) next.password = 'Usá al menos 8 caracteres.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleCreate() {
    Keyboard.dismiss();
    if (loading || !validate()) return;
    setLoading(true);
    setServerError('');
    try {
      await userService.create({
        ...form,
        nombre: form.nombre.trim(),
        apellido: form.apellido.trim(),
        correo: form.correo.trim().toLowerCase(),
      });
      navigation.goBack();
    } catch (err) {
      setServerError(err.response?.data?.message || (err.request
        ? 'No se pudo conectar con el servidor. Revisá que el backend esté iniciado.'
        : 'No se pudo crear el usuario. Revisá los datos e intentá de nuevo.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TrackedScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
      >
        <View style={styles.pageHeader}>
          <View style={[styles.headerIcon, { backgroundColor: colors.soft }]}><Text style={styles.headerEmoji}>＋</Text></View>
          <View style={styles.headerCopy}>
            <Text style={[styles.heading, { color: colors.text }]}>Nuevo usuario</Text>
            <Text style={[styles.subtitle, { color: colors.muted }]}>Completá los datos y asigná el acceso correcto.</Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos de la cuenta</Text>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>Los campos marcados con * son obligatorios.</Text>
          <Input label="Nombre *" value={form.nombre} onChangeText={(value) => set('nombre', value)} error={errors.nombre} autoCapitalize="words" returnKeyType="next" showFocusStyle={false} />
          <Input label="Apellido *" value={form.apellido} onChangeText={(value) => set('apellido', value)} error={errors.apellido} autoCapitalize="words" returnKeyType="next" showFocusStyle={false} />
          <Input label="Correo electrónico *" value={form.correo} onChangeText={(value) => set('correo', value)} error={errors.correo} keyboardType="email-address" autoCapitalize="none" autoComplete="email" returnKeyType="next" showFocusStyle={false} />
          <Input label="Contraseña *" value={form.password} onChangeText={(value) => set('password', value)} error={errors.password} hint="Mínimo 8 caracteres" secureTextEntry autoComplete="new-password" returnKeyType="done" onSubmitEditing={handleCreate} showFocusStyle={false} />
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Permisos y rol</Text>
          <Text style={[styles.sectionHint, { color: colors.muted }]}>Elegí qué funciones podrá usar esta cuenta.</Text>
          <View style={styles.roleGrid}>
            {roleOptions.map((option) => {
              const selected = form.rol === option.value;
              return (
                <Pressable
                  key={option.value}
                  style={[
                    styles.roleCard,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    selected && { backgroundColor: colors.soft, borderColor: colors.primary },
                  ]}
                  onPress={() => set('rol', option.value)}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected }}
                >
                  <View style={styles.roleTop}>
                    <View style={[styles.roleIconBox, { backgroundColor: selected ? colors.surface : colors.soft }]}>
                      <Text style={styles.roleIcon}>{option.icon}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: selected ? colors.primary : colors.border }]}>
                      {selected ? <View style={[styles.radioDot, { backgroundColor: colors.primary }]} /> : null}
                    </View>
                  </View>
                  <Text style={[styles.roleName, { color: selected ? colors.primary : colors.text }]}>{ROLE_LABELS[option.value]}</Text>
                  <Text style={[styles.roleDescription, { color: colors.muted }]}>{option.description}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {serverError ? <Text accessibilityRole="alert" style={styles.serverError}>{serverError}</Text> : null}
        <Button title="Crear usuario" icon="＋" onPress={handleCreate} loading={loading} disabled={loading} size="lg" style={styles.submit} />
        <Text style={[styles.footerHint, { color: colors.muted }]}>La persona podrá iniciar sesión con el correo y la contraseña asignados.</Text>
      </TrackedScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { width: '100%', maxWidth: 760, alignSelf: 'center', padding: 20, paddingBottom: 40, gap: 16 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 2 },
  headerIcon: { width: 48, height: 48, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  headerEmoji: { fontSize: 28, color: '#2458D3', fontWeight: '500', lineHeight: 32 },
  headerCopy: { flex: 1 },
  heading: { fontSize: 23, fontWeight: '800', letterSpacing: -0.4 },
  subtitle: { fontSize: 13, lineHeight: 19, marginTop: 3 },
  card: { borderWidth: 1, borderRadius: 18, padding: 18, shadowColor: '#17233D', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.04, shadowRadius: 12, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '750', marginBottom: 3 },
  sectionHint: { fontSize: 12, lineHeight: 18, marginBottom: 18 },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  roleCard: { flexBasis: '48%', flexGrow: 1, minWidth: 210, borderWidth: 1, borderRadius: 14, padding: 13 },
  roleTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  roleIconBox: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  roleIcon: { fontSize: 18 },
  radio: { width: 20, height: 20, borderWidth: 1.5, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 10, height: 10, borderRadius: 5 },
  roleName: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  roleDescription: { fontSize: 11, lineHeight: 16 },
  serverError: { color: '#B42332', backgroundColor: '#FDEBEC', borderRadius: 12, padding: 12, fontSize: 13, lineHeight: 19 },
  submit: { marginTop: 1, borderRadius: 13 },
  footerHint: { fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: -7 },
});
