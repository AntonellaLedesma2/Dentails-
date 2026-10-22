import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import Card, { StatCard } from '../../components/Card';
import Colors from '../../constants/colors';
import appointmentService from '../../services/appointmentService';

const today = new Date().toLocaleDateString('es-AR', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

export default function OdontologoHomeScreen({ navigation }) {
  const { user } = useAuth();
  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  const [turnosHoy,      setTurnosHoy]      = useState('—');
  const [proximosTurnos, setProximosTurnos] = useState([]);

  useEffect(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    appointmentService.getAll({ fecha: todayStr })
      .then((data) => {
        setTurnosHoy(data.length);
        setProximosTurnos(data.slice(0, 3));
      })
      .catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      <View style={styles.greetingSection}>
        <Text style={styles.greeting}>{greeting}, Dr/a. {user?.nombre}.</Text>
        <Text style={styles.date}>{today.charAt(0).toUpperCase() + today.slice(1)}</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard icon="📅" label="Turnos hoy"    value={String(turnosHoy)} color={Colors.primary} bg={Colors.primaryLight} style={styles.statFlex} />
        <StatCard icon="🦷" label="Mis pacientes" value="—"                 color={Colors.success} bg={Colors.successLight} style={styles.statFlex} />
      </View>

      {/* Próximos turnos */}
      <Card title="Mi agenda de hoy" action="Ver todo" onAction={() => navigation.navigate('Agenda')} style={styles.card}>
        {proximosTurnos.length === 0 ? (
          <Text style={styles.emptyText}>No hay turnos programados para hoy</Text>
        ) : (
          proximosTurnos.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={styles.turnoRow}
              onPress={() => navigation.navigate('AppointmentForm', { mode: 'edit', appointmentId: t.id })}
            >
              <Text style={styles.turnoHora}>{t.hora?.substring(0,5)}</Text>
              <View style={styles.turnoInfo}>
                <Text style={styles.turnoPaciente}>{t.paciente_nombre}</Text>
                {t.motivo && <Text style={styles.turnoMotivo}>{t.motivo}</Text>}
              </View>
            </TouchableOpacity>
          ))
        )}
      </Card>

      {/* Módulos clínicos */}
      <Text style={styles.sectionLabel}>MÓDULOS CLÍNICOS</Text>
      <View style={styles.grid}>
        {[
          { icon: '🦷', label: 'Pacientes',     screen: 'Patients',       bg: Colors.primaryLight },
          { icon: '📋', label: 'Ficha clínica', screen: 'ClinicalRecords', bg: Colors.successLight,
            onPress: () => navigation.navigate('Patients') }, // navega a pacientes para elegir
          { icon: '💊', label: 'Tratamientos',  screen: 'Treatments',     bg: Colors.warningLight },
          { icon: '📅', label: 'Mi agenda',     screen: 'Agenda',         bg: Colors.infoLight },
        ].map((item) => (
          <TouchableOpacity
            key={item.screen}
            style={[styles.moduleCard, { backgroundColor: item.bg }]}
            onPress={item.onPress || (() => navigation.navigate(item.screen))}
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
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statFlex: { flex: 1 },
  card:     { marginBottom: 16 },
  emptyText:{ fontSize: 13, color: Colors.text.secondary, fontStyle: 'italic', paddingVertical: 8 },
  turnoRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.divider,
  },
  turnoHora:     { fontSize: 15, fontWeight: '700', color: Colors.primary, minWidth: 46 },
  turnoInfo:     { flex: 1 },
  turnoPaciente: { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  turnoMotivo:   { fontSize: 12, color: Colors.text.secondary },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label,
    letterSpacing: 1, marginBottom: 10, marginLeft: 2,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  moduleCard: { width: '47%', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  moduleIcon:  { fontSize: 28 },
  moduleLabel: { fontSize: 13, fontWeight: '600', color: Colors.text.primary, textAlign: 'center' },
});
