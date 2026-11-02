import React, { useState } from 'react';
import { TrackedScrollView } from '../../components/TrackedScroll';
import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import RoleBadge from '../../components/RoleBadge';
import Button from '../../components/Button';
import Colors from '../../constants/colors';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [confirmLogout, setConfirmLogout] = useState(false);

  async function handleLogout() {
    try { await logout(); } catch {} finally { setConfirmLogout(false); }
  }

  const menuItems = [
    { icon: '🔑', label: 'Cambiar contraseña', screen: 'ChangePassword' },
    { icon: '❓', label: 'Ayuda y soporte',    screen: 'Help' },
  ];

  return (
    <TrackedScrollView style={styles.container} contentContainerStyle={styles.content}>

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
        onPress={() => setConfirmLogout(true)}
        variant="danger"
        style={styles.logoutBtn}
      />

      <Text style={styles.version}>DENTALIS v1.0.0</Text>
      <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => setConfirmLogout(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cerrar sesión</Text>
            <Text style={styles.modalMessage}>¿Estás seguro que querés salir de tu cuenta?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setConfirmLogout(false)}><Text style={styles.modalCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={handleLogout}><Text style={styles.modalConfirmText}>Cerrar sesión</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </TrackedScrollView>
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
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.card, borderRadius: 16, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  modalMessage: { fontSize: 14, color: Colors.text.secondary, marginTop: 8, lineHeight: 21 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 22 },
  modalCancel: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 9, backgroundColor: Colors.background },
  modalCancelText: { color: Colors.text.primary, fontWeight: '600' },
  modalConfirm: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 9, backgroundColor: '#D9232E' },
  modalConfirmText: { color: '#FFFFFF', fontWeight: '700' },
});
