import React from 'react';
import {
  Platform, ScrollView, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../constants/roles';
import Colors from '../constants/colors';

const MENUS = {
  [ROLES.ADMINISTRADOR]: [
    { section: 'CLÍNICA', label: 'Resumen', icon: '▦', route: 'AdminHome' },
    { section: 'CLÍNICA', label: 'Agenda general', icon: '▣', route: 'Agenda' },
    { section: 'CLÍNICA', label: 'Pacientes', icon: '◉', route: 'Patients' },
    { section: 'GESTIÓN', label: 'Usuarios y roles', icon: '♙', route: 'UsersList' },
    { section: 'GESTIÓN', label: 'Tratamientos y precios', icon: '◇', route: 'Treatments' },
    { section: 'GESTIÓN', label: 'Reportes', icon: '▥', route: 'Reports' },
    { section: 'CUENTA', label: 'Mi perfil', icon: '○', route: 'Profile' },
  ],
  [ROLES.RECEPCION]: [
    { section: 'CLÍNICA', label: 'Resumen', icon: '▦', route: 'RecepcionHome' },
    { section: 'CLÍNICA', label: 'Agenda', icon: '▣', route: 'Agenda' },
    { section: 'CLÍNICA', label: 'Pacientes', icon: '◉', route: 'Patients' },
    { section: 'ADMINISTRACIÓN', label: 'Pagos y cuentas', icon: '$', route: 'Payments' },
    { section: 'CUENTA', label: 'Mi perfil', icon: '○', route: 'Profile' },
  ],
  [ROLES.ODONTOLOGO]: [
    { section: 'ATENCIÓN CLÍNICA', label: 'Resumen', icon: '▦', route: 'OdontologoHome' },
    { section: 'ATENCIÓN CLÍNICA', label: 'Mi agenda', icon: '▣', route: 'Agenda' },
    { section: 'ATENCIÓN CLÍNICA', label: 'Mis pacientes', icon: '◉', route: 'Patients' },
    { section: 'ATENCIÓN CLÍNICA', label: 'Fichas clínicas', icon: '▤', route: 'ClinicalRecords' },
    { section: 'ATENCIÓN CLÍNICA', label: 'Tratamientos', icon: '◇', route: 'Treatments' },
    { section: 'CUENTA', label: 'Mi perfil', icon: '○', route: 'Profile' },
  ],
  [ROLES.USUARIO]: [
    { section: 'MI CUENTA', label: 'Inicio', icon: '⌂', route: 'UsuarioHome' },
    { section: 'MI CUENTA', label: 'Mi perfil', icon: '○', route: 'Profile' },
    { section: 'MI CUENTA', label: 'Cambiar contraseña', icon: '▣', route: 'ChangePassword' },
    { section: 'AYUDA', label: 'Ayuda', icon: '?', route: 'Help' },
  ],
};

const ROUTE_TITLES = {
  CreateUser: 'Nuevo usuario',
  EditUser: 'Editar usuario',
  NewPatient: 'Nuevo paciente',
  NewAppointment: 'Nuevo turno',
  PatientForm: 'Datos del paciente',
  PatientDetail: 'Paciente',
  AppointmentForm: 'Datos del turno',
  ChangePassword: 'Cambiar contraseña',
  ClinicalRecords: 'Fichas clínicas',
  Treatments: 'Tratamientos',
  Reports: 'Reportes',
  Payments: 'Pagos y cuentas',
  Help: 'Ayuda',
  ...Object.fromEntries(
  Object.values(MENUS).flat().map(({ route, label }) => [route, label])
  ),
};

function NavItem({ item, active, onPress, compact = false }) {
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[compact ? styles.compactItem : styles.navItem, active && styles.navItemActive]}
    >
      <Text style={[styles.navIcon, active && styles.navTextActive]}>{item.icon}</Text>
      <Text numberOfLines={1} style={[styles.navLabel, active && styles.navTextActive]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

export default function WorkspaceShell({ role, route, navigation, children }) {
  const { user, logout } = useAuth();
  const { width } = useWindowDimensions();
  const menu = MENUS[role] || MENUS[ROLES.USUARIO];
  const isDesktop = Platform.OS === 'web' && width >= 1080;
  const title = ROUTE_TITLES[route?.name] || route?.name || 'DENTALIS';
  const sections = [...new Set(menu.map((item) => item.section))];

  function openRoute(target) {
    if (target !== route?.name) navigation.navigate(target);
  }

  async function handleLogout() {
    await logout();
  }

  const navigationItems = (compact = false) => menu.map((item) => (
    <NavItem
      key={item.route}
      item={item}
      compact={compact}
      active={route?.name === item.route}
      onPress={() => openRoute(item.route)}
    />
  ));

  return (
    <View style={styles.root}>
      {isDesktop ? (
        <View style={styles.sidebar}>
          <View style={styles.brandRow}>
            <View style={styles.brandMark}><Text style={styles.brandTooth}>✦</Text></View>
            <View>
              <Text style={styles.brand}>DENTALIS</Text>
              <Text style={styles.brandCaption}>GESTIÓN CLÍNICA</Text>
            </View>
          </View>
          <View style={styles.clinicCard}>
            <View style={styles.clinicIcon}><Text style={styles.clinicGlyph}>✚</Text></View>
            <View style={styles.clinicCopy}>
              <Text style={styles.clinicTitle}>Clínica Dental</Text>
              <Text style={styles.clinicSubtitle}>{ROLE_LABELS[role]}</Text>
            </View>
            <Text style={styles.chevron}>⌄</Text>
          </View>
          <ScrollView style={styles.sideNav} showsVerticalScrollIndicator={false}>
            {sections.map((section) => (
              <View key={section} style={styles.navSection}>
                <Text style={styles.sectionLabel}>{section}</Text>
                {menu.filter((item) => item.section === section).map((item) => (
                  <NavItem
                    key={item.route}
                    item={item}
                    active={route?.name === item.route}
                    onPress={() => openRoute(item.route)}
                  />
                ))}
              </View>
            ))}
          </ScrollView>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>↪</Text>
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <View style={styles.userCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.nombre || 'U').slice(0, 1).toUpperCase()}</Text></View>
            <View style={styles.userCopy}>
              <Text numberOfLines={1} style={styles.userName}>{user?.nombre} {user?.apellido}</Text>
              <Text numberOfLines={1} style={styles.userRole}>{ROLE_LABELS[role]}</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.mobileHeader}>
          <View style={styles.mobileTop}>
            {navigation.canGoBack() ? (
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} accessibilityLabel="Volver">
                <Text style={styles.backGlyph}>‹</Text>
              </TouchableOpacity>
            ) : null}
            <View style={styles.mobileBrandMark}><Text style={styles.brandTooth}>✦</Text></View>
            <View style={styles.mobileTitleWrap}>
              <Text style={styles.mobileTitle}>{title}</Text>
              <Text style={styles.mobileRole}>{ROLE_LABELS[role]}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.mobileLogout} accessibilityLabel="Cerrar sesión">
              <Text style={styles.logoutIcon}>↪</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mobileNav}>
            {navigationItems(true)}
          </ScrollView>
        </View>
      )}

      <View style={styles.main}>
        {isDesktop && (
          <View style={styles.topbar}>
            <View>
              <Text style={styles.breadcrumb}>DENTALIS  /  {title.toUpperCase()}</Text>
              <Text style={styles.pageTitle}>{title}</Text>
            </View>
            <TouchableOpacity onPress={() => openRoute('Profile')} style={styles.topProfile}>
              <View style={styles.avatarSmall}><Text style={styles.avatarText}>{(user?.nombre || 'U').slice(0, 1).toUpperCase()}</Text></View>
              <View>
                <Text style={styles.topUserName}>{user?.nombre} {user?.apellido}</Text>
                <Text style={styles.topRole}>{ROLE_LABELS[role]}</Text>
              </View>
              <Text style={styles.chevron}>⌄</Text>
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

export function withWorkspace(Screen, role) {
  function WorkspaceRoute(props) {
    return (
      <WorkspaceShell role={role} route={props.route} navigation={props.navigation}>
        <Screen {...props} />
      </WorkspaceShell>
    );
  }
  WorkspaceRoute.displayName = `Workspace(${Screen.displayName || Screen.name || 'Screen'})`;
  return WorkspaceRoute;
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: '#F4F7FB' },
  sidebar: { width: 252, backgroundColor: '#FFFFFF', borderRightWidth: 1, borderRightColor: '#E8EDF4', paddingHorizontal: 18, paddingTop: 24, paddingBottom: 16 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 26, paddingHorizontal: 5 },
  brandMark: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F0FF' },
  mobileBrandMark: { width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F0FF' },
  brandTooth: { color: '#2458D3', fontSize: 21, fontWeight: '800' },
  brand: { color: '#1F3157', fontSize: 17, fontWeight: '800', letterSpacing: 1.3 },
  brandCaption: { color: '#8D9AB1', fontSize: 9, fontWeight: '700', letterSpacing: 1.4, marginTop: 2 },
  clinicCard: { minHeight: 60, borderRadius: 12, backgroundColor: '#F6F8FC', borderWidth: 1, borderColor: '#E9EDF4', flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 10, marginBottom: 23 },
  clinicIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#E6F0FF', alignItems: 'center', justifyContent: 'center' },
  clinicGlyph: { color: '#2D66D7', fontSize: 18, fontWeight: '800' },
  clinicCopy: { flex: 1 },
  clinicTitle: { color: '#263653', fontSize: 12, fontWeight: '700' },
  clinicSubtitle: { color: '#8190A9', fontSize: 11, marginTop: 3 },
  chevron: { color: '#91A0B7', fontSize: 18 },
  sideNav: { flex: 1 },
  navSection: { marginBottom: 17 },
  sectionLabel: { color: '#A0AABD', fontSize: 9, fontWeight: '800', letterSpacing: 1.2, marginHorizontal: 9, marginBottom: 8 },
  navItem: { height: 42, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 11, marginBottom: 3 },
  navItemActive: { backgroundColor: '#EAF1FF' },
  navIcon: { width: 18, textAlign: 'center', color: '#8290A7', fontSize: 17, fontWeight: '600' },
  navLabel: { color: '#697A95', fontSize: 12, fontWeight: '600', flexShrink: 1 },
  navTextActive: { color: '#2458D3', fontWeight: '700' },
  logoutButton: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingHorizontal: 11, paddingVertical: 12 },
  logoutIcon: { color: '#71819B', fontSize: 19 },
  logoutText: { color: '#71819B', fontSize: 12, fontWeight: '600' },
  userCard: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EDF0F5', paddingTop: 14, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E6F0FF', alignItems: 'center', justifyContent: 'center' },
  avatarSmall: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#E6F0FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#2458D3', fontSize: 14, fontWeight: '800' },
  userCopy: { flex: 1 },
  userName: { color: '#263653', fontSize: 12, fontWeight: '700' },
  userRole: { color: '#8592A7', fontSize: 10, marginTop: 2 },
  main: { flex: 1, minWidth: 0, backgroundColor: '#F4F7FB' },
  topbar: { height: 82, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF4', paddingHorizontal: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  breadcrumb: { color: '#98A5B9', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  pageTitle: { color: '#273754', fontSize: 18, fontWeight: '700', marginTop: 5 },
  topProfile: { flexDirection: 'row', alignItems: 'center', gap: 9, padding: 7 },
  topUserName: { color: '#34435D', fontSize: 11, fontWeight: '700' },
  topRole: { color: '#8D9AB1', fontSize: 10, marginTop: 3 },
  content: { flex: 1, minHeight: 0 },
  mobileHeader: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8EDF4', paddingTop: Platform.OS === 'ios' ? 48 : 12 },
  mobileTop: { height: 46, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  backButton: { width: 30, height: 36, alignItems: 'center', justifyContent: 'center' },
  backGlyph: { color: '#536784', fontSize: 32, lineHeight: 34 },
  mobileTitleWrap: { flex: 1 },
  mobileTitle: { color: '#273754', fontSize: 14, fontWeight: '700' },
  mobileRole: { color: '#8D9AB1', fontSize: 10, marginTop: 2 },
  mobileLogout: { width: 36, alignItems: 'center', justifyContent: 'center' },
  mobileNav: { paddingHorizontal: 10, paddingVertical: 5, gap: 4 },
  compactItem: { minHeight: 34, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 9 },
});
