import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import userService from '../../services/userService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../constants/colors';
import { ROLES, ROLE_LABELS } from '../../constants/roles';
import { TouchableOpacity } from 'react-native';

const rolesOptions = Object.values(ROLES);

export default function CreateUserScreen({ navigation }) {
  const [form, setForm]   = useState({ nombre: '', apellido: '', correo: '', password: '', rol: ROLES.RECEPCION });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.nombre.trim())   e.nombre   = 'Nombre requerido';
    if (!form.apellido.trim()) e.apellido = 'Apellido requerido';
    if (!form.correo.trim() || !/\S+@\S+\.\S+/.test(form.correo)) e.correo = 'Correo inválido';
    if (form.password.length < 8) e.password = 'Mínimo 8 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreate() {
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.create(form);
      Alert.alert('Éxito', 'Usuario creado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Input label="Nombre"   value={form.nombre}   onChangeText={(v) => set('nombre', v)}   error={errors.nombre} />
        <Input label="Apellido" value={form.apellido} onChangeText={(v) => set('apellido', v)} error={errors.apellido} />
        <Input label="Correo"   value={form.correo}   onChangeText={(v) => set('correo', v)}   error={errors.correo}   keyboardType="email-address" autoCapitalize="none" />
        <Input label="Contraseña (mínimo 8 caracteres)" value={form.password} onChangeText={(v) => set('password', v)} error={errors.password} secureTextEntry />

        <Text style={styles.label}>Rol</Text>
        <View style={styles.rolesRow}>
          {rolesOptions.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleChip, form.rol === r && styles.roleChipActive]}
              onPress={() => set('rol', r)}
              accessibilityRole="radio"
              accessibilityState={{ checked: form.rol === r }}
            >
              <Text style={[styles.roleChipText, form.rol === r && styles.roleChipTextActive]}>
                {ROLE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Crear usuario" onPress={handleCreate} loading={loading} style={styles.btn} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, marginBottom: 8 },
  rolesRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  roleChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  roleChipText:       { fontSize: 13, color: Colors.text.secondary },
  roleChipTextActive: { fontSize: 13, color: Colors.primaryDark, fontWeight: '600' },
  btn: { marginTop: 8 },
});
