import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import paymentService from '../../services/paymentService';
import Colors from '../../constants/colors';

const methodLabel = { efectivo: 'Efectivo', tarjeta_debito: 'Tarjeta de débito', tarjeta_credito: 'Tarjeta de crédito', transferencia: 'Transferencia', obra_social: 'Obra social' };
const money = (v) => `Gs. ${Number(v || 0).toLocaleString('es-PY')}`;

export default function SalesScreen() {
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const load = useCallback(async () => {
    try {
      const [items, totals] = await Promise.all([paymentService.getAll(), paymentService.getAdminSummary()]);
      setPayments(items); setSummary(totals);
    } catch { /* La lista permanece vacía y se puede actualizar deslizando. */ }
    finally { setLoading(false); setRefreshing(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  return (
    <FlatList
      style={s.container} contentContainerStyle={s.content} data={payments}
      keyExtractor={(item) => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} />}
      ListHeaderComponent={(
        <>
          <Text style={s.eyebrow}>ADMINISTRACIÓN FINANCIERA</Text>
          <Text style={s.title}>Ventas</Text>
          <View style={s.totalCard}><Text style={s.totalLabel}>Ingresos cobrados este mes</Text><Text style={s.totalValue}>{money(summary?.totales?.total_mes)}</Text><Text style={s.totalMeta}>{summary?.totales?.cantidad_pagos || 0} pagos registrados</Text></View>
          <Text style={s.sectionTitle}>MOVIMIENTOS RECIENTES</Text>
        </>
      )}
      renderItem={({ item }) => (
        <Card style={s.rowCard}>
          <View style={s.row}>
            <View style={s.initials}><Text style={s.initialsText}>{(item.paciente_nombre || 'P')[0]}</Text></View>
            <View style={s.copy}><Text style={s.patient}>{item.paciente_nombre || 'Paciente'}</Text><Text style={s.meta}>{item.tratamiento_desc || methodLabel[item.metodo] || item.metodo} · {item.odontologo_nombre || 'Clínica'}</Text><Text style={s.date}>{new Date(item.fecha).toLocaleDateString('es-PY')}</Text></View>
            <Text style={s.amount}>{money(item.importe)}</Text>
          </View>
        </Card>
      )}
      ListEmptyComponent={<Text style={s.empty}>Todavía no hay ventas registradas.</Text>}
    />
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: { padding: 20, paddingBottom: 40, maxWidth: 1080, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#8290A7', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, title: { color: '#243450', fontSize: 23, fontWeight: '800', marginTop: 5, marginBottom: 15 }, totalCard: { backgroundColor: '#22365A', borderRadius: 14, padding: 20, marginBottom: 20 }, totalLabel: { color: '#CAD5E8', fontSize: 11 }, totalValue: { color: '#fff', fontSize: 27, fontWeight: '800', marginTop: 6 }, totalMeta: { color: '#B4C3DD', fontSize: 10, marginTop: 5 }, sectionTitle: { color: '#8693A8', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginBottom: 8 }, rowCard: { marginBottom: 8, padding: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 11 }, initials: { width: 36, height: 36, backgroundColor: '#EAF1FF', borderRadius: 18, alignItems: 'center', justifyContent: 'center' }, initialsText: { color: '#2D60D6', fontSize: 14, fontWeight: '800' }, copy: { flex: 1 }, patient: { color: '#34435E', fontSize: 11, fontWeight: '800' }, meta: { color: '#8290A5', fontSize: 9, marginTop: 3 }, date: { color: '#A0AABC', fontSize: 8, marginTop: 3 }, amount: { color: '#28845F', fontSize: 12, fontWeight: '800' }, empty: { color: '#8491A5', textAlign: 'center', padding: 35 },
});
