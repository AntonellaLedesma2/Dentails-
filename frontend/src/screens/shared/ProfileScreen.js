import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../../components/RoleBadge';
import Button from '../../components/Button';
import Colors from '../../constants/colors';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();

  async function handleLogout() {
    Alert.alert('Cerrar sesión', '¿Estás seguro que querés salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar sesión',
        style: 'destructive',
        onPress: async () => {
          try { await logout(); } catch {}
        },
      },
    ]);
  }

  const menuItems = [
    { icon: '🔑', label: 'Cambiar contraseña', screen: 'ChangePassword' },
    { icon: '❓', label: 'Ayuda y soporte',    screen: 'Help' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header de perfil */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.nombre?.[0]}{user?.apellido?.[0]}</Text>
        </View>
        <Text style={styles.name}>{user?.nombre} {user?.apellido}</Text>
        <Text style={styles.email}>{user?.correo}</Text>
        <RoleBadge rol={user?.rol} />
      </View>

      {/* Sección de opciones */}
      <Text style={styles.sectionLabel}>CUENTA</Text>
      <View style={styles.section}>
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.optionRow, i < menuItems.length - 1 && styles.optionBorder]}
            onPress={() => navigation.navigate(item.screen)}
            accessibilityRole="button"
          >
            <View style={styles.optionLeft}>
              <Text style={styles.optionIcon}>{item.icon}</Text>
              <Text style={styles.optionLabel}>{item.label}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        title="Cerrar sesión"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutBtn}
      />

      <Text style={styles.version}>DENTALIS v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 20, paddingBottom: 40 },

  profileHeader: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 8,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  avatarText: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  name:  { fontSize: 20, fontWeight: '700', color: Colors.text.primary },
  email: { fontSize: 13, color: Colors.text.secondary },

  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.text.label,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    marginBottom: 20,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionBorder: { borderBottomWidth: 1, borderBottomColor: Colors.divider },
  optionLeft:   { flexDirection: 'row', alignItems: 'center', gap: 12 },
  optionIcon:   { fontSize: 18 },
  optionLabel:  { fontSize: 15, color: Colors.text.primary, fontWeight: '500' },
  chevron:      { fontSize: 20, color: Colors.gray[300] },

  logoutBtn: { marginBottom: 20 },
  version:   { textAlign: 'center', fontSize: 12, color: Colors.text.label },
});
