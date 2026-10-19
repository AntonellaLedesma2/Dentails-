import React, { useState } from 'react';
import {
  View, StyleSheet, Alert, KeyboardAvoidingView,
  Platform, ScrollView,
} from 'react-native';
import userService from '../../services/userService';
import Button from '../../components/Button';
import Input from '../../components/Input';
import Colors from '../../constants/colors';

export default function ChangePasswordScreen({ navigation }) {
  const [form, setForm]     = useState({ current: '', nuevo: '', confirmar: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const e = {};
    if (!form.current)                e.current   = 'Ingresá tu contraseña actual';
    if (form.nuevo.length < 8)        e.nuevo     = 'Mínimo 8 caracteres';
    if (form.nuevo !== form.confirmar) e.confirmar = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleChange() {
    if (!validate()) return;
    setLoading(true);
    try {
      await userService.changePassword(form.current, form.nuevo);
      Alert.alert('Éxito', 'Contraseña actualizada correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cambiar la contraseña');
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
        <Input
          label="Contraseña actual"
          value={form.current}
          onChangeText={(v) => set('current', v)}
          error={errors.current}
          secureTextEntry
        />
        <Input
          label="Nueva contraseña"
          value={form.nuevo}
          onChangeText={(v) => set('nuevo', v)}
          error={errors.nuevo}
          secureTextEntry
        />
        <Input
          label="Confirmar nueva contraseña"
          value={form.confirmar}
          onChangeText={(v) => set('confirmar', v)}
          error={errors.confirmar}
          secureTextEntry
        />
        <Button title="Cambiar contraseña" onPress={handleChange} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:      { flex: 1, backgroundColor: Colors.background },
  container: { padding: 20 },
});
