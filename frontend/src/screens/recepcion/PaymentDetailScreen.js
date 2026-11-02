import React, { useCallback, useEffect, useState } from 'react';
import { TrackedScrollView } from '../../components/TrackedScroll';
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../../components/Card';
import paymentService from '../../services/paymentService';
import Colors from '../../constants/colors';

const money = (value) => `Gs. ${Number(value || 0).toLocaleString('es-PY')}`;
const methodNames = { efectivo: 'Efectivo', tarjeta_debito: 'Tarjeta de débito', tarjeta_credito: 'Tarjeta de crédito', transferencia: 'Transferencia', obra_social: 'Obra social' };

export default function PaymentDetailScreen({ route, navigation }) {
  const { pacienteId, odontologoId } = route.params || {};
  const [account, setAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    try {
      const [accounts, receipts] = await Promise.all([
        paymentService.getByOdontologoPacientes(odontologoId),
        paymentService.getAll({ paciente_id: pacienteId, odontologo_id: odontologoId }),
      ]);
      setAccount(accounts.find((item) => Number(item.paciente_id) === Number(pacienteId)) || null);
      setPayments(receipts);
    } catch (error) { Alert.alert('Error', error.response?.data?.message || 'No se pudo cargar la cuenta'); }
    finally { setLoading(false); }
  }, [odontologoId, pacienteId]);
useEffect(() => {
  const timer = setTimeout(() => {
    void load();
  }, 0);

  return () => clearTimeout(timer);
}, [load]);
  if (loading) return <View style={s.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  return (
    <TrackedScrollView style={s.container} contentContainerStyle={s.content}>
      <Text style={s.eyebrow}>CUENTA DEL PACIENTE</Text>
      <Text style={s.title}>{account?.paciente_nombre || 'Detalle de cuenta'}</Text>
      <Text style={s.subtitle}>Cuenta asociada al odontólogo seleccionado.</Text>
      <View style={s.summaryGrid}>
        <View style={s.summaryCard}><Text style={s.summaryLabel}>Total de tratamientos</Text><Text style={s.summaryValue}>{money(account?.total_tratamientos)}</Text></View>
        <View style={[s.summaryCard, s.paidCard]}><Text style={s.summaryLabel}>Total pagado</Text><Text style={s.summaryValue}>{money(account?.total_pagado)}</Text></View>
        <View style={[s.summaryCard, s.dueCard]}><Text style={s.summaryLabel}>Saldo pendiente</Text><Text style={s.summaryValue}>{money(account?.saldo_pendiente)}</Text></View>
      </View>
      <TouchableOpacity style={s.payButton} onPress={() => navigation.navigate('NewPayment', { pacienteId, odontologoId })}>
        <Text style={s.payButtonText}>＋ Registrar pago</Text>
      </TouchableOpacity>
      <Text style={s.sectionTitle}>MOVIMIENTOS DE PAGO</Text>
      {payments.map((item) => (
        <Card key={item.id} style={s.paymentCard}>
          <View style={s.paymentRow}><View style={s.receiptMark}><Text style={s.receiptGlyph}>✓</Text></View><View style={{ flex: 1 }}><Text style={s.description}>{item.tratamiento_desc || 'Pago de cuenta'}</Text><Text style={s.meta}>{methodNames[item.metodo] || item.metodo} · {new Date(item.fecha).toLocaleDateString('es-PY')}</Text>{item.referencia ? <Text style={s.meta}>Comprobante {item.referencia}</Text> : null}</View><Text style={s.amount}>{money(item.importe)}</Text></View>
        </Card>
      ))}
      {!payments.length && <Text style={s.empty}>Todavía no hay pagos registrados para este paciente y odontólogo.</Text>}
    </TrackedScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center' }, content: { padding: 20, paddingBottom: 40, maxWidth: 1100, width: '100%', alignSelf: 'center' },
  eyebrow: { color: '#8290A7', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 }, title: { color: '#263653', fontSize: 22, fontWeight: '800', marginTop: 5 }, subtitle: { color: '#8290A7', fontSize: 10, marginTop: 4, marginBottom: 15 }, summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 }, summaryCard: { flex: 1, minWidth: 130, backgroundColor: '#fff', borderColor: '#E8EDF4', borderWidth: 1, borderRadius: 12, padding: 14 }, paidCard: { backgroundColor: '#F0FAF5' }, dueCard: { backgroundColor: '#FFF8EA' }, summaryLabel: { color: '#7F8DA3', fontSize: 9 }, summaryValue: { color: '#30415F', fontSize: 15, fontWeight: '800', marginTop: 7 }, payButton: { backgroundColor: '#2D60D6', borderRadius: 9, padding: 12, alignItems: 'center', marginVertical: 15 }, payButtonText: { color: '#fff', fontSize: 11, fontWeight: '800' }, sectionTitle: { color: '#8794A8', fontSize: 9, fontWeight: '800', letterSpacing: 1, marginTop: 4, marginBottom: 8 }, paymentCard: { marginBottom: 8, padding: 12 }, paymentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, receiptMark: { width: 31, height: 31, borderRadius: 9, backgroundColor: '#E7F7F0', alignItems: 'center', justifyContent: 'center' }, receiptGlyph: { color: '#21845F', fontSize: 13, fontWeight: '800' }, description: { color: '#45546E', fontSize: 10, fontWeight: '700' }, meta: { color: '#8794A8', fontSize: 8, marginTop: 3 }, amount: { color: '#21845F', fontSize: 10, fontWeight: '800' }, empty: { color: '#8794A8', fontSize: 10, textAlign: 'center', padding: 24 },
});
