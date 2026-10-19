import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Alert,
  KeyboardAvoidingView, Platform, ActivityIndicator, TouchableOpacity,
} from 'react-native';
import userService from '../../services/userService';
import Button from '../../components/Button';
import RoleBadge from '../../components/RoleBadge';
import Colors from '../../constants/colors';
import { ROLES, ROLE_LABELS } from '../../constants/roles';

const rolesOptions = Object.values(ROLES);

export default function EditUserScreen({ route, navigation }) {
  const { userId } = route.params;

  const [user, setUser]     = useState(null);
  const [rol, setRol]       = useState('');
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await userService.getById(userId);
        setUser(data);
        setRol(data.rol);
      } catch (err) {
        Alert.alert('Error', 'No se pudo cargar el usuario');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  async function handleSave() {
    if (rol === user.rol) {
      navigation.goBack();
      return;
    }
    setSaving(true);
    try {
      await userService.update(userId, { rol });
      Alert.alert('Éxito', 'Rol actualizado correctamente', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo actualizar');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container}>
        {/* Info del usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.nombre[0]}{user.apellido[0]}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{user.nombre} {user.apellido}</Text>
            <Text style={styles.userEmail}>{user.correo}</Text>
            <RoleBadge rol={user.rol} />
          </View>
        </View>

        {/* Selector de rol */}
        <Text style={styles.label}>Cambiar rol</Text>
        <View style={styles.rolesCol}>
          {rolesOptions.map((r) => (
            <TouchableOpacity
              key={r}
              style={[styles.roleRow, rol === r && styles.roleRowActive]}
              onPress={() => setRol(r)}
              accessibilityRole="radio"
              accessibilityState={{ checked: rol === r }}
            >
              <View style={[styles.radio, rol === r && styles.radioActive]}>
                {rol === r && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.roleText, rol === r && styles.roleTextActive]}>
                {ROLE_LABELS[r]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Guardar cambios"
          onPress={handleSave}
          loading={saving}
          disabled={rol === user.rol}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex:    { flex: 1, backgroundColor: Colors.background },
  centered:{ flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 20, paddingBottom: 40 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    elevation: 2,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: Colors.primaryDark },
  userName:   { fontSize: 16, fontWeight: '600', color: Colors.text.primary, marginBottom: 2 },
  userEmail:  { fontSize: 13, color: Colors.text.secondary, marginBottom: 6 },
  label: { fontSize: 14, fontWeight: '500', color: Colors.text.primary, marginBottom: 12 },
  rolesCol: { gap: 10, marginBottom: 24 },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.card,
  },
  roleRowActive:  { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioActive:  { borderColor: Colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },
  roleText:       { fontSize: 15, color: Colors.text.secondary },
  roleTextActive: { fontSize: 15, color: Colors.primaryDark, fontWeight: '600' },
  btn: { marginTop: 4 },
});
