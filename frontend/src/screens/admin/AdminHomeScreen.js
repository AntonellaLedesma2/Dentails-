import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, StatusBar,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Card, { StatCard } from '../../components/Card';
import Colors from '../../constants/colors';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';

const today = new Date().toLocaleDateString('es-AR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

export default function AdminHomeScreen({ navigation }) {
  const { user } = useAuth();
  const [turnosHoy, setTurnosHoy]       = useState('—');
  const [usuariosActivos, setUsuarios]  = useState('—');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const today = new Date().toISOString().substring(0, 10);

  useEffect(() => {
    appointmentService.getAll({ fecha: today })
      .then((data) => setTurnosHoy(data.length))
      .catch(() => {});
    userService.getAll()
      .then((data) => setUsuarios(data.filter((u) => u.estado === 'activo').length))
      .catch(() => {});
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      {/* Saludo */}
      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}, {user?.nombre}.</Text>
        <Text style={styles.date}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <StatCard icon="📅" label="Turnos hoy"      value={String(turnosHoy)} color={Colors.primary}  bg={Colors.primaryLight} style={styles.statFlex} />
        <StatCard icon="👥" label="Usuarios activos" value={String(usuariosActivos)} color={Colors.success}  bg={Colors.successLight} style={styles.statFlex} />
      </View>

      <View style={styles.statsRow}>
        <StatCard
          icon="🦷"
          label="Pacientes total"
          value="—"
          color={Colors.navy}
          bg={Colors.backgroundAlt}
          style={styles.statFlex}
        />
        <StatCard
          icon="💰"
          label="Cobros este mes"
          value="—"
          color={Colors.warning}
          bg={Colors.warningLight}
          style={styles.statFlex}
        />
      </View>

      {/* Accesos rápidos */}
      <Card title="Accesos rápidos" style={styles.menuCard}>
        <View style={styles.menuGrid}>
          {[
            { icon: '👥', label: 'Usuarios',  screen: 'UsersList',  color: Colors.primaryLight },
            { icon: '📅', label: 'Agenda',    screen: 'Agenda',     color: Colors.successLight },
            { icon: '🦷', label: 'Pacientes', screen: 'Patients',   color: Colors.infoLight },
            { icon: '📊', label: 'Reportes',  screen: 'Reports',    color: Colors.warningLight },
          ].map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={[styles.menuItem, { backgroundColor: item.color }]}
              onPress={() => navigation.navigate(item.screen)}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {/* Actividad reciente */}
      <Card title="Actividad reciente" action="Ver todo" style={styles.activityCard}>
        <View style={styles.emptyActivity}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyText}>Sin actividad reciente</Text>
        </View>
      </Card>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content:   { padding: 20, paddingBottom: 40 },

  greetingSection: { marginBottom: 20 },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text.primary,
    letterSpacing: -0.3,
  },
  date: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginTop: 3,
  },

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statFlex: { flex: 1 },

  menuCard: { marginTop: 12, marginBottom: 12 },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  menuItem: {
    width: '47%',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  menuIcon:  { fontSize: 28 },
  menuLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.primary },

  activityCard: { marginBottom: 12 },
  emptyActivity: { alignItems: 'center', paddingVertical: 20 },
  emptyIcon: { fontSize: 32, marginBottom: 8 },
  emptyText: { fontSize: 13, color: Colors.text.secondary },
});
