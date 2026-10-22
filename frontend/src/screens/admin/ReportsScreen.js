import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, ActivityIndicator,
  RefreshControl,
} from 'react-native';
import paymentService     from '../../services/paymentService';
import patientService     from '../../services/patientService';
import appointmentService from '../../services/appointmentService';
import Card, { StatCard } from '../../components/Card';
import Colors from '../../constants/colors';

function BarChart({ data }) {
  if (!data || data.length === 0) return <Text style={{ color: Colors.text.secondary, textAlign: 'center', padding: 12 }}>Sin datos</Text>;
  const maxVal = Math.max(...data.map((d) => d.total));

  return (
    <View style={bar.container}>
      {data.map((item, i) => {
        const height = maxVal > 0 ? Math.max((item.total / maxVal) * 100, 4) : 4;
        return (
          <View key={i} style={bar.col}>
            <Text style={bar.value}>
              ${(item.total / 1000).toFixed(0)}k
            </Text>
            <View style={[bar.bar, { height }]} />
            <Text style={bar.label}>{item.mes?.slice(5)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const bar = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 140, paddingTop: 20 },
  col:       { flex: 1, alignItems: 'center', gap: 4 },
  bar:       { width: '70%', backgroundColor: Colors.primary, borderRadius: 4 },
  value:     { fontSize: 9, color: Colors.text.secondary },
  label:     { fontSize: 10, color: Colors.text.secondary },
});

export default function ReportsScreen() {
  const [summary, setSummary]         = useState(null);
  const [paymentSummary, setPaySum]   = useState([]);
  const [totalPacientes, setTotalPac] = useState('—');
  const [turnosHoy, setTurnosHoy]     = useState('—');
  const [loading, setLoading]         = useState(true);
  const [refreshing, setRefreshing]   = useState(false);

  async function loadData() {
    try {
      const today = new Date().toISOString().substring(0, 10);
      const [adminSum, odontologoSum, pacientes, turnos] = await Promise.all([
        paymentService.getAdminSummary(),
        paymentService.getSummaryByOdontologo(),
        patientService.getAll(),
        appointmentService.getAll({ fecha: today }),
      ]);
      setSummary(adminSum);
      setPaySum(odontologoSum);
      setTotalPac(pacientes.length);
      setTurnosHoy(turnos.length);
    } catch {}
    finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  function formatCurrency(val) {
    return `$${parseFloat(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`;
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={Colors.primary} />}
    >
      {/* Stats del mes */}
      <Text style={styles.sectionLabel}>RESUMEN DEL MES</Text>
      <View style={styles.statsRow}>
        <StatCard icon="💰" label="Cobrado este mes"  value={formatCurrency(summary?.totales?.total_mes)} color={Colors.success} bg={Colors.successLight} style={styles.flex} />
        <StatCard icon="📋" label="Pagos registrados" value={String(summary?.totales?.cantidad_pagos ?? '—')} color={Colors.primary} bg={Colors.primaryLight} style={styles.flex} />
      </View>
      <View style={styles.statsRow}>
        <StatCard icon="🦷" label="Pacientes totales" value={String(totalPacientes)} color={Colors.navy} bg={Colors.backgroundAlt} style={styles.flex} />
        <StatCard icon="📅" label="Turnos hoy"        value={String(turnosHoy)} color={Colors.warning} bg={Colors.warningLight} style={styles.flex} />
      </View>

      {/* Gráfico de cobros */}
      <Card title="Cobros últimos 6 meses" style={styles.card}>
        <BarChart data={summary?.porMes || []} />
      </Card>

      {/* Resumen por odontólogo */}
      <Text style={styles.sectionLabel}>POR ODONTÓLOGO</Text>
      {paymentSummary.map((o) => (
        <View key={o.odontologo_id} style={styles.odoCard}>
          <View style={styles.odoHeader}>
            <View style={styles.odoAvatar}>
              <Text style={styles.odoAvatarText}>{o.odontologo_nombre[0]}</Text>
            </View>
            <View style={styles.odoInfo}>
              <Text style={styles.odoName}>Dr/a. {o.odontologo_nombre}</Text>
              <Text style={styles.odoSub}>{o.total_pacientes} pacientes · {o.total_pagos} pagos</Text>
            </View>
            <Text style={styles.odoTotal}>{formatCurrency(o.total_cobrado)}</Text>
          </View>
        </View>
      ))}
      {paymentSummary.length === 0 && (
        <Text style={styles.emptyText}>Sin datos de cobros</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:   { padding: 16, paddingBottom: 40 },
  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label,
    letterSpacing: 1, marginBottom: 10, marginTop: 8, marginLeft: 2,
  },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  flex:     { flex: 1 },
  card:     { marginBottom: 16 },
  odoCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 8, borderWidth: 1, borderColor: Colors.cardBorder, elevation: 1,
  },
  odoHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  odoAvatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  odoAvatarText: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  odoInfo:  { flex: 1 },
  odoName:  { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  odoSub:   { fontSize: 12, color: Colors.text.secondary, marginTop: 2 },
  odoTotal: { fontSize: 16, fontWeight: '700', color: Colors.success },
  emptyText: { textAlign: 'center', color: Colors.text.secondary, marginTop: 20 },
});
