import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { ROLE_LABELS, ROLES } from '../../constants/roles';
import Colors from '../../constants/colors';
import appointmentService from '../../services/appointmentService';
import patientService from '../../services/patientService';
import userService from '../../services/userService';

const CONFIG = {
  [ROLES.ADMINISTRADOR]: {
    greeting: 'Panel de administración',
    subtitle: 'Organizá la clínica y controlá la operación general.',
    actions: [
      { label: 'Gestionar usuarios', detail: 'Cuentas y roles', icon: '♙', route: 'UsersList', tone: 'blue' },
      { label: 'Agenda general', detail: 'Todos los turnos', icon: '▣', route: 'Agenda', tone: 'green' },
      { label: 'Pacientes', detail: 'Datos administrativos', icon: '◉', route: 'Patients', tone: 'violet' },
      { label: 'Reportes', detail: 'Indicadores de gestión', icon: '▥', route: 'Reports', tone: 'amber' },
      { label: 'Tratamientos', detail: 'Catálogo y precios', icon: '◇', route: 'Treatments', tone: 'rose' },
    ],
  },
  [ROLES.RECEPCION]: {
    greeting: 'Recepción',
    subtitle: 'Coordiná los turnos y acompañá a cada paciente.',
    actions: [
      { label: 'Nuevo turno', detail: 'Agendar una visita', icon: '+', route: 'NewAppointment', tone: 'blue' },
      { label: 'Nuevo paciente', detail: 'Cargar datos administrativos', icon: '◉', route: 'NewPatient', tone: 'green' },
      { label: 'Agenda', detail: 'Confirmar o reprogramar', icon: '▣', route: 'Agenda', tone: 'violet' },
      { label: 'Pagos y cuentas', detail: 'Gestión de cobros', icon: '$', route: 'Payments', tone: 'amber' },
    ],
  },
  [ROLES.ODONTOLOGO]: {
    greeting: 'Espacio clínico',
    subtitle: 'Tu agenda y la atención de tus pacientes.',
    actions: [
      { label: 'Mi agenda', detail: 'Solo tus turnos', icon: '▣', route: 'Agenda', tone: 'blue' },
      { label: 'Mis pacientes', detail: 'Pacientes asignados', icon: '◉', route: 'Patients', tone: 'green' },
      { label: 'Fichas clínicas', detail: 'Consultas y evolución', icon: '▤', route: 'ClinicalRecords', tone: 'violet' },
      { label: 'Tratamientos', detail: 'Planes de atención', icon: '◇', route: 'Treatments', tone: 'amber' },
    ],
  },
  [ROLES.USUARIO]: {
    greeting: 'Tu espacio en DENTALIS',
    subtitle: 'Administrá tu cuenta y consultá la ayuda del sistema.',
    actions: [
      { label: 'Mi perfil', detail: 'Tus datos de acceso', icon: '○', route: 'Profile', tone: 'blue' },
      { label: 'Cambiar contraseña', detail: 'Seguridad de la cuenta', icon: '▣', route: 'ChangePassword', tone: 'green' },
      { label: 'Ayuda', detail: 'Soporte y orientación', icon: '?', route: 'Help', tone: 'violet' },
    ],
  },
};

function localDate() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatTime(value) {
  return String(value || '').slice(0, 5);
}

function getTone(tone) {
  return {
    blue: { bg: '#EAF1FF', color: '#2D60D6' },
    green: { bg: '#E7F7F0', color: '#17845D' },
    violet: { bg: '#F1EDFF', color: '#7556C9' },
    amber: { bg: '#FFF5DF', color: '#AF7415' },
    rose: { bg: '#FFF0F0', color: '#CB5D70' },
  }[tone] || { bg: '#EAF1FF', color: '#2D60D6' };
}

function MetricCard({ label, value, icon, tone }) {
  const palette = getTone(tone);
  return (
    <View style={styles.metricCard}>
      <View style={[styles.metricIcon, { backgroundColor: palette.bg }]}>
        <Text style={[styles.metricGlyph, { color: palette.color }]}>{icon}</Text>
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

export default function RoleDashboardScreen({ role, navigation }) {
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1080;
  const config = CONFIG[role] || CONFIG[ROLES.USUARIO];
  const [appointments, setAppointments] = useState([]);
  const [activeUsers, setActiveUsers] = useState('—');
  const [patientCount, setPatientCount] = useState('—');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let current = true;
    async function loadDashboard() {
      if (role === ROLES.USUARIO) {
        setLoading(false);
        return;
      }
      const requests = [appointmentService.getAll({ fecha: localDate() })];
      if (role === ROLES.ADMINISTRADOR) requests.push(userService.getAll(), patientService.getAll());
      const results = await Promise.allSettled(requests);
      if (!current) return;
      if (results[0].status === 'fulfilled') setAppointments(results[0].value);
      if (role === ROLES.ADMINISTRADOR) {
        if (results[1]?.status === 'fulfilled') setActiveUsers(results[1].value.filter((item) => item.estado === 'activo').length);
        if (results[2]?.status === 'fulfilled') setPatientCount(results[2].value.length);
      }
      setLoading(false);
    }
    loadDashboard();
    return () => { current = false; };
  }, [role]);

  const pendingCount = appointments.filter((item) => item.estado === 'pendiente').length;
  const confirmedCount = appointments.filter((item) => item.estado === 'confirmado').length;
  const uniquePatients = useMemo(() => new Set(appointments.map((item) => item.paciente_id)).size, [appointments]);
  const dateLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const stats = role === ROLES.ADMINISTRADOR
    ? [
        { label: 'Turnos de hoy', value: appointments.length, icon: '▣', tone: 'blue' },
        { label: 'Usuarios activos', value: activeUsers, icon: '♙', tone: 'green' },
        { label: 'Pacientes activos', value: patientCount, icon: '◉', tone: 'violet' },
      ]
    : role === ROLES.RECEPCION
      ? [
          { label: 'Turnos de hoy', value: appointments.length, icon: '▣', tone: 'blue' },
          { label: 'Pendientes', value: pendingCount, icon: '◷', tone: 'amber' },
          { label: 'Confirmados', value: confirmedCount, icon: '✓', tone: 'green' },
        ]
      : role === ROLES.ODONTOLOGO
        ? [
            { label: 'Turnos de hoy', value: appointments.length, icon: '▣', tone: 'blue' },
            { label: 'Pacientes de hoy', value: uniquePatients, icon: '◉', tone: 'green' },
            { label: 'Pendientes', value: pendingCount, icon: '◷', tone: 'amber' },
          ]
        : [];

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={[styles.welcome, isDesktop && styles.welcomeDesktop]}>
        <View style={styles.welcomeText}>
          <Text style={styles.eyebrow}>{dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}</Text>
          <Text style={styles.heading}>{config.greeting}, {user?.nombre || 'bienvenido'}.</Text>
          <Text style={styles.subtitle}>{config.subtitle}</Text>
        </View>
        <View style={styles.roleChip}><Text style={styles.roleChipText}>{ROLE_LABELS[role]}</Text></View>
      </View>

      {role === ROLES.USUARIO ? (
        <View style={styles.personalCard}>
          <View style={styles.personalMark}><Text style={styles.personalGlyph}>○</Text></View>
          <View style={styles.personalCopy}>
            <Text style={styles.personalTitle}>Acceso personal</Text>
            <Text style={styles.personalText}>Este perfil puede administrar sus propios datos de cuenta. No tiene acceso a pacientes, agenda clínica, cobros ni gestión de usuarios.</Text>
          </View>
          <TouchableOpacity style={styles.personalAction} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.personalActionText}>Ver perfil  ›</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.metricGrid}>
          {stats.map((item) => <MetricCard key={item.label} {...item} />)}
        </View>
      )}

      <View style={[styles.panels, isDesktop && styles.panelsDesktop]}>
        {role !== ROLES.USUARIO && (
          <View style={[styles.panel, isDesktop && styles.agendaPanel]}>
            <View style={styles.panelHeader}>
              <View>
                <Text style={styles.panelTitle}>{role === ROLES.ODONTOLOGO ? 'Mi agenda de hoy' : 'Agenda de hoy'}</Text>
                <Text style={styles.panelSubtitle}>{appointments.length} {appointments.length === 1 ? 'turno programado' : 'turnos programados'}</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Agenda')} style={styles.textAction}>
                <Text style={styles.textActionLabel}>Ver agenda  ›</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <ActivityIndicator color={Colors.primary} style={styles.loader} />
            ) : appointments.length ? (
              appointments.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.appointmentRow}
                  activeOpacity={0.75}
                  onPress={() => role === ROLES.ODONTOLOGO
                    ? navigation.navigate('PatientDetail', { patientId: item.paciente_id })
                    : navigation.navigate('AppointmentForm', { mode: 'edit', appointmentId: item.id })}
                >
                  <View style={styles.timePill}><Text style={styles.timeText}>{formatTime(item.hora)}</Text></View>
                  <View style={styles.appointmentCopy}>
                    <Text style={styles.appointmentName}>{item.paciente_nombre}</Text>
                    <Text style={styles.appointmentMeta}>
                      {role === ROLES.ODONTOLOGO ? (item.motivo || 'Atención clínica') : `${item.odontologo_nombre || 'Odontólogo'}${item.motivo ? ` · ${item.motivo}` : ''}`}
                    </Text>
                  </View>
                  <View style={[styles.statusDot, { backgroundColor: item.estado === 'confirmado' ? '#29A979' : item.estado === 'cancelado' ? '#D97777' : '#E7A83C' }]} />
                  <Text style={styles.rowStatus}>{item.estado}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyAgenda}>
                <Text style={styles.emptyIcon}>▣</Text>
                <Text style={styles.emptyTitle}>Todavía no hay turnos</Text>
                <Text style={styles.emptyText}>{role === ROLES.RECEPCION ? 'Agendá una visita para empezar a organizar el día.' : 'Los próximos turnos aparecerán en este espacio.'}</Text>
                {role === ROLES.RECEPCION && (
                  <TouchableOpacity style={styles.emptyAction} onPress={() => navigation.navigate('NewAppointment')}>
                    <Text style={styles.emptyActionText}>+ Agendar turno</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        )}

        <View style={[styles.panel, isDesktop && styles.actionsPanel]}>
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelTitle}>{role === ROLES.USUARIO ? 'Accesos de tu cuenta' : 'Accesos rápidos'}</Text>
              <Text style={styles.panelSubtitle}>Herramientas de {ROLE_LABELS[role].toLowerCase()}</Text>
            </View>
          </View>
          <View style={styles.actionList}>
            {config.actions.map((action) => {
              const palette = getTone(action.tone);
              return (
                <TouchableOpacity key={action.route} style={styles.actionRow} onPress={() => navigation.navigate(action.route)}>
                  <View style={[styles.actionIcon, { backgroundColor: palette.bg }]}><Text style={[styles.actionGlyph, { color: palette.color }]}>{action.icon}</Text></View>
                  <View style={styles.actionCopy}>
                    <Text style={styles.actionTitle}>{action.label}</Text>
                    <Text style={styles.actionDetail}>{action.detail}</Text>
                  </View>
                  <Text style={styles.actionChevron}>›</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F4F7FB' },
  content: { padding: 26, paddingBottom: 40, maxWidth: 1500, width: '100%', alignSelf: 'center' },
  welcome: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 22 },
  welcomeDesktop: { marginBottom: 25 },
  welcomeText: { flex: 1 },
  eyebrow: { color: '#8A98AE', fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  heading: { color: '#233452', fontSize: 25, fontWeight: '800', letterSpacing: -0.4, marginTop: 7 },
  subtitle: { color: '#77869E', fontSize: 12, marginTop: 6, lineHeight: 18 },
  roleChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#EAF1FF' },
  roleChipText: { color: '#2D60D6', fontSize: 10, fontWeight: '700' },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginBottom: 20 },
  metricCard: { flex: 1, minWidth: 150, borderRadius: 13, borderWidth: 1, borderColor: '#E8EDF4', backgroundColor: '#FFFFFF', padding: 16 },
  metricIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  metricGlyph: { fontSize: 18, fontWeight: '700' },
  metricLabel: { color: '#8290A7', fontSize: 10, fontWeight: '600' },
  metricValue: { color: '#273754', fontSize: 25, fontWeight: '800', marginTop: 4 },
  personalCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 13, borderWidth: 1, borderColor: '#E8EDF4', backgroundColor: '#FFFFFF', marginBottom: 20 },
  personalMark: { width: 44, height: 44, borderRadius: 13, backgroundColor: '#EAF1FF', alignItems: 'center', justifyContent: 'center' },
  personalGlyph: { color: '#2D60D6', fontSize: 25 },
  personalCopy: { flex: 1 },
  personalTitle: { color: '#263653', fontSize: 13, fontWeight: '700' },
  personalText: { color: '#7B899F', fontSize: 11, lineHeight: 17, marginTop: 5 },
  personalAction: { padding: 8 },
  personalActionText: { color: '#2D60D6', fontSize: 11, fontWeight: '700' },
  panels: { gap: 16 },
  panelsDesktop: { flexDirection: 'row', alignItems: 'flex-start' },
  panel: { borderRadius: 13, borderWidth: 1, borderColor: '#E8EDF4', backgroundColor: '#FFFFFF', padding: 17 },
  agendaPanel: { flex: 1.6, minWidth: 360 },
  actionsPanel: { flex: 1, minWidth: 300 },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginBottom: 12 },
  panelTitle: { color: '#293954', fontSize: 13, fontWeight: '800' },
  panelSubtitle: { color: '#8B98AC', fontSize: 10, marginTop: 4 },
  textAction: { padding: 6 },
  textActionLabel: { color: '#2D60D6', fontSize: 10, fontWeight: '700' },
  loader: { paddingVertical: 28 },
  appointmentRow: { minHeight: 62, borderTopWidth: 1, borderTopColor: '#F0F2F6', flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 9 },
  timePill: { width: 49, height: 33, borderRadius: 8, backgroundColor: '#EFF4FF', alignItems: 'center', justifyContent: 'center' },
  timeText: { color: '#3969CB', fontSize: 10, fontWeight: '800' },
  appointmentCopy: { flex: 1 },
  appointmentName: { color: '#33425D', fontSize: 11, fontWeight: '700' },
  appointmentMeta: { color: '#8A97AA', fontSize: 9, marginTop: 4 },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  rowStatus: { color: '#8290A7', fontSize: 9, textTransform: 'capitalize' },
  emptyAgenda: { alignItems: 'center', paddingHorizontal: 16, paddingVertical: 28 },
  emptyIcon: { color: '#9AA9C1', fontSize: 27, marginBottom: 8 },
  emptyTitle: { color: '#43536D', fontSize: 12, fontWeight: '700' },
  emptyText: { color: '#8B98AC', fontSize: 10, textAlign: 'center', lineHeight: 16, marginTop: 5, maxWidth: 280 },
  emptyAction: { backgroundColor: '#2D60D6', borderRadius: 8, paddingHorizontal: 13, paddingVertical: 9, marginTop: 14 },
  emptyActionText: { color: '#FFFFFF', fontSize: 10, fontWeight: '700' },
  actionList: { gap: 5 },
  actionRow: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  actionIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionGlyph: { fontSize: 17, fontWeight: '700' },
  actionCopy: { flex: 1 },
  actionTitle: { color: '#36455F', fontSize: 10, fontWeight: '700' },
  actionDetail: { color: '#8B98AC', fontSize: 9, marginTop: 3 },
  actionChevron: { color: '#9BA8BB', fontSize: 21 },
});
