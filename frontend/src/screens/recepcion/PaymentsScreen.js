import React, { useEffect, useState, useCallback } from 'react';
import { TrackedFlatList } from '../../components/TrackedScroll';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import paymentService from '../../services/paymentService';
import Colors from '../../constants/colors';

export default function PaymentsScreen({ navigation }) {
  const [odontologos, setOdontologos] = useState([]);
  const [selected, setSelected]       = useState(null);
  const [pacientes, setPacientes]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [loadingPac, setLoadingPac]   = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const fetchSummary = useCallback(async () => {
    try {
      const data = await paymentService.getSummaryByOdontologo();
      setOdontologos(data);
      if (data.length > 0) {
  setSelected((current) => current ?? data[0].odontologo_id);
}
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
  const timer = setTimeout(() => {
    void fetchSummary();
  }, 0);

  return () => clearTimeout(timer);
}, [fetchSummary]);

  useEffect(() => {
    if (!selected) return;
    paymentService.getByOdontologoPacientes(selected)
      .then(setPacientes)
      .catch(() => {})
      .finally(() => setLoadingPac(false));
  }, [selected]);

  function formatCurrency(val) {
  return `Gs. ${Number(val || 0).toLocaleString('es-PY')}`;
  }

  const selectedOdontologo = odontologos.find((o) => o.odontologo_id === selected);

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      {/* Selector de odontólogos */}
      <View style={styles.odontologoStrip}>
        <TrackedFlatList
          horizontal
          data={odontologos}
          keyExtractor={(o) => String(o.odontologo_id)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.odoBtn, selected === item.odontologo_id && styles.odoBtnActive]}
onPress={() => {
  setLoadingPac(true);
  setSelected(item.odontologo_id);
}}            >
              <View style={styles.odoAvatar}>
                <Text style={styles.odoAvatarText}>{item.odontologo_nombre[0]}</Text>
              </View>
              <Text style={[styles.odoName, selected === item.odontologo_id && styles.odoNameActive]}
                numberOfLines={1}>
                Dr/a. {item.odontologo_nombre.split(' ')[0]}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay odontólogos activos</Text>
          }
        />
      </View>

      {/* Resumen del odontólogo seleccionado */}
      {selectedOdontologo && (
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: Colors.primaryLight }]}>
            <Text style={styles.summaryLabel}>Pacientes</Text>
            <Text style={[styles.summaryValue, { color: Colors.primary }]}>
              {selectedOdontologo.total_pacientes}
            </Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: Colors.successLight }]}>
            <Text style={styles.summaryLabel}>Total cobrado</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {formatCurrency(selectedOdontologo.total_cobrado)}
            </Text>
          </View>
        </View>
      )}

      {/* Lista de pacientes */}
      <Text style={styles.sectionLabel}>CUENTAS DE PACIENTES</Text>

      {loadingPac ? (
        <ActivityIndicator color={Colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <TrackedFlatList
          data={pacientes}
          keyExtractor={(p) => String(p.paciente_id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSummary(); }} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.pacCard}
              onPress={() => navigation.navigate('PaymentDetail', { pacienteId: item.paciente_id, odontologoId: selected })}
            >
              <View style={styles.pacInfo}>
                <Text style={styles.pacName}>{item.paciente_nombre}</Text>
                <View style={styles.pacAmounts}>
                  <Text style={styles.pacPaid}>Pagado: {formatCurrency(item.total_pagado)}</Text>
                  <Text style={[
                    styles.pacPending,
                    { color: item.saldo_pendiente > 0 ? Colors.error : Colors.success }
                  ]}>
                    {item.saldo_pendiente > 0
                      ? `Debe: ${formatCurrency(item.saldo_pendiente)}`
                      : 'Al día ✓'}
                  </Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💰</Text>
              <Text style={styles.emptyText}>Sin cuentas para este odontólogo</Text>
            </View>
          }
        />
      )}

      {/* FAB nuevo pago */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NewPayment', { odontologoId: selected })}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  odontologoStrip: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  stripContent: { paddingHorizontal: 16, gap: 10 },
  odoBtn: {
    alignItems: 'center', gap: 4,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5,
    borderColor: Colors.border, backgroundColor: Colors.white,
    minWidth: 80,
  },
  odoBtnActive:  { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  odoAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  odoAvatarText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  odoName:       { fontSize: 11, color: Colors.text.secondary, fontWeight: '500' },
  odoNameActive: { color: Colors.primary, fontWeight: '700' },

  summaryRow: { flexDirection: 'row', gap: 12, padding: 16, paddingBottom: 8 },
  summaryCard: {
    flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', gap: 4,
  },
  summaryLabel: { fontSize: 12, color: Colors.text.secondary },
  summaryValue: { fontSize: 22, fontWeight: '700' },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label,
    letterSpacing: 1, marginLeft: 16, marginBottom: 8, marginTop: 4,
  },
  list: { paddingHorizontal: 16, paddingBottom: 90 },
  pacCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 12,
    padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: Colors.cardBorder, elevation: 1,
  },
  pacInfo:    { flex: 1 },
  pacName:    { fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: 4 },
  pacAmounts: { flexDirection: 'row', gap: 12 },
  pacPaid:    { fontSize: 12, color: Colors.text.secondary },
  pacPending: { fontSize: 12, fontWeight: '600' },
  chevron:    { fontSize: 22, color: Colors.gray[300] },

  empty: { alignItems: 'center', paddingTop: 40, gap: 10 },
  emptyIcon: { fontSize: 36 },
  emptyText: { fontSize: 14, color: Colors.text.secondary },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  fabIcon: { fontSize: 26, color: Colors.white, lineHeight: 30 },
});
