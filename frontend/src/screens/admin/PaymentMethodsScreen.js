import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import Card from '../../components/Card';
import paymentService from '../../services/paymentService';
import Colors from '../../constants/colors';

const METHODS = [
  ['efectivo', 'Efectivo', '💵', '#E7F7F0', '#208260'],
  ['tarjeta_debito', 'Tarjeta de débito', '💳', '#EAF1FF', '#3466CE'],
  ['tarjeta_credito', 'Tarjeta de crédito', '▤', '#F1EDFF', '#7658C9'],
  ['transferencia', 'Transferencia', '⇄', '#FFF5DF', '#AF7415'],
  ['obra_social', 'Obra social', '⌂', '#FFF0F0', '#CB5D70'],
];
const money = (v) => `Gs. ${Number(v || 0).toLocaleString('es-PY')}`;

export default function PaymentMethodsScreen() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try { setPayments(await paymentService.getAll()); } catch { setPayments([]); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={s.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;
  return (
    <ScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>FINANZAS · ESTE MES</Text>
      <Text style={s.title}>Métodos de pago</Text>
      <Text style={s.subtitle}>Distribución de los pagos registrados según el medio utilizado.</Text>
      {METHODS.map(([key, label, icon, bg, color]) => {
        const matched = payments.filter((p) => p.metodo === key);
        const total = matched.reduce((sum, p) => sum + Number(p.importe || 0), 0);
        return (
          <Card key={key} style={s.card}>
            <View style={s.row}>
              <View style={[s.iconBox, { backgroundColor: bg }]}><Text style={[s.icon, { color }]}>{icon}</Text></View>
              <View style={s.copy}><Text style={s.name}>{label}</Text><Text style={s.meta}>{matched.length} {matched.length === 1 ? 'pago' : 'pagos'} · total histórico</Text></View>
              <Text style={s.total}>{money(total)}</Text>
            </View>
          </Card>
        );
      })}
      <Text style={s.note}>Los medios disponibles para registrar cobros son efectivo, tarjetas, transferencia y obra social.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' }, centered: { flex: 1, justifyContent: 'center', alignItems: 'center' }, content: { padding: 20, paddingBottom: 40, maxWidth: 1000, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#8290A7', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, title: { color: '#243450', fontSize: 23, fontWeight: '800', marginTop: 5 }, subtitle: { color: '#8290A7', fontSize: 11, marginTop: 5, marginBottom: 16 }, card: { marginBottom: 9, padding: 14 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12 }, iconBox: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, icon: { fontSize: 18, fontWeight: '800' }, copy: { flex: 1 }, name: { color: '#34435E', fontSize: 12, fontWeight: '800' }, meta: { color: '#8996A9', fontSize: 9, marginTop: 4 }, total: { color: '#2D60D6', fontSize: 11, fontWeight: '800' }, note: { color: '#93A0B2', fontSize: 9, textAlign: 'center', marginTop: 15, lineHeight: 14 },
});
