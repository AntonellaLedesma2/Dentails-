import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Card, { StatCard } from '../../components/Card';
import Colors from '../../constants/colors';

const today = new Date().toLocaleDateString('es-AR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

export default function RecepcionHomeScreen({ navigation }) {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}, {user?.nombre}.</Text>
        <Text style={styles.date}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: Colors.primary }]}
          onPress={() => navigation.navigate('NewPatient')}
        >
          <Text style={styles.quickIcon}>➕</Text>
          <Text style={styles.quickLabel}>Nuevo paciente</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickBtn, { backgroundColor: Colors.navy }]}
          onPress={() => navigation.navigate('NewAppointment')}
        >
          <Text style={styles.quickIcon}>📅</Text>
          <Text style={styles.quickLabel}>Nuevo turno</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="📅" label="Turnos hoy" value="—" color={Colors.primary} bg={Colors.primaryLight} style={styles.statFlex} />
        <StatCard icon="⏳" label="Pendientes" value="—" color={Colors.warning} bg={Colors.warningLight} style={styles.statFlex} />
      </View>

      {/* Turnos de hoy */}
      <Card title="Turnos de hoy" action="Ver agenda" onAction={() => navigation.navigate('Agenda')} style={styles.card}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>No hay turnos cargados</Text>
        </View>
      </Card>

      {/* Accesos */}
      <Text style={styles.sectionLabel}>MÓDULOS</Text>
      <View style={styles.grid}>
        {[
          { icon: '📅', label: 'Agenda',    screen: 'Agenda',    bg: Colors.primaryLight },
          { icon: '🦷', label: 'Pacientes', screen: 'Patients',  bg: Colors.successLight },
          { icon: '💰', label: 'Pagos',     screen: 'Payments',  bg: Colors.warningLight },
        ].map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.moduleCard, { backgroundColor: item.bg }]}
            onPress={() => navigation.navigate(item.screen)}
            accessibilityRole="button"
          >
            <Text style={styles.moduleIcon}>{item.icon}</Text>
            <Text style={styles.moduleLabel}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 20, paddingBottom: 40 },

  greetingSection: { marginBottom: 20 },
  greeting: { fontSize: 24, fontWeight: '700', color: Colors.text.primary, letterSpacing: -0.3 },
  date:     { fontSize: 13, color: Colors.text.secondary, marginTop: 3 },

  quickActions: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  quickIcon:  { fontSize: 18 },
  quickLabel: { fontSize: 14, fontWeight: '600', color: Colors.white },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statFlex: { flex: 1 },

  card: { marginBottom: 20 },
  empty: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 28, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.text.secondary },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label,
    letterSpacing: 1, marginBottom: 10, marginLeft: 2,
  },
  grid: { flexDirection: 'row', gap: 12 },
  moduleCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  moduleIcon:  { fontSize: 26 },
  moduleLabel: { fontSize: 12, fontWeight: '600', color: Colors.text.primary },
});
