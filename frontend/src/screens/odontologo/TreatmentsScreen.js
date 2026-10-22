import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import treatmentService from '../../services/treatmentService';
import StatusBadge from '../../components/StatusBadge';
import Card from '../../components/Card';
import Colors from '../../constants/colors';

const ESTADO_COLORS = {
  planificado: { bg: Colors.warningLight,  text: Colors.warning },
  en_curso:    { bg: Colors.primaryLight,  text: Colors.primary },
  completado:  { bg: Colors.successLight,  text: Colors.success },
  cancelado:   { bg: Colors.errorLight,    text: Colors.error   },
};

const ESTADO_LABELS = {
  planificado: 'Planificado',
  en_curso:    'En curso',
  completado:  'Completado',
  cancelado:   'Cancelado',
};

export default function TreatmentsScreen({ route, navigation }) {
  const patientId = route?.params?.patientId || null;

  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = patientId ? { paciente_id: patientId } : {};
      const data = await treatmentService.getAll(params);
      setTreatments(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cargar');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetch();
    const unsub = navigation.addListener('focus', fetch);
    return unsub;
  }, [fetch, navigation]);

  function renderItem({ item }) {
    const theme = ESTADO_COLORS[item.estado] || { bg: Colors.gray[100], text: Colors.gray[500] };
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('TreatmentDetail', { treatmentId: item.id })}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <Text style={styles.desc}>{item.descripcion}</Text>
            <Text style={styles.patient}>{item.paciente_nombre}</Text>
          </View>
          <View style={[styles.estadoBadge, { backgroundColor: theme.bg }]}>
            <Text style={[styles.estadoText, { color: theme.text }]}>
              {ESTADO_LABELS[item.estado]}
            </Text>
          </View>
        </View>
        {item.costo_total !== null && (
          <View style={styles.costoRow}>
            <Text style={styles.costoLabel}>Costo total</Text>
            <Text style={styles.costoValue}>
              ${parseFloat(item.costo_total).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </Text>
          </View>
        )}
        {item.notas && <Text style={styles.notas}>{item.notas}</Text>}
      </TouchableOpacity>
    );
  }

  if (loading) return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={treatments}
        keyExtractor={(t) => String(t.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💊</Text>
            <Text style={styles.emptyText}>No hay tratamientos registrados</Text>
          </View>
        }
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TreatmentForm', { mode: 'create', patientId })}
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 90 },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  cardInfo:   { flex: 1 },
  desc:       { fontSize: 15, fontWeight: '600', color: Colors.text.primary, marginBottom: 3 },
  patient:    { fontSize: 12, color: Colors.text.secondary },
  estadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  estadoText:  { fontSize: 12, fontWeight: '600' },
  costoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.divider,
  },
  costoLabel: { fontSize: 13, color: Colors.text.secondary },
  costoValue: { fontSize: 15, fontWeight: '700', color: Colors.primary },
  notas:      { fontSize: 12, color: Colors.text.secondary, marginTop: 6, fontStyle: 'italic' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon:  { fontSize: 40 },
  emptyText:  { fontSize: 14, color: Colors.text.secondary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 10, elevation: 8,
  },
  fabIcon: { fontSize: 26, color: Colors.white, lineHeight: 30 },
});
