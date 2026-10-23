import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import treatmentService from '../../services/treatmentService';
import treatmentCatalogService from '../../services/treatmentCatalogService';
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
  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const params = patientId ? { paciente_id: patientId } : {};
      const [data, prices] = await Promise.all([
        treatmentService.getAll(params), treatmentCatalogService.getAll(),
      ]);
      setTreatments(data);
      setCatalog(prices);
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
            <Text style={styles.costoValue}>Gs. {Number(item.costo_total).toLocaleString('es-PY')}</Text>
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
        ListHeaderComponent={(
          <View style={styles.catalogPanel}>
            <View style={styles.catalogHeader}>
              <View><Text style={styles.catalogEyebrow}>ARANCELARIO DE LA CLÍNICA</Text><Text style={styles.catalogTitle}>Tratamientos y precios</Text></View>
              <Text style={styles.catalogMark}>◇</Text>
            </View>
            {catalog.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.priceRow}>
                <View style={styles.priceCopy}><Text style={styles.priceName}>{item.nombre}</Text><Text style={styles.priceCategory}>{item.categoria} · {item.duracion_min} min</Text></View>
                <Text style={styles.catalogPrice}>Gs. {Number(item.precio).toLocaleString('es-PY')}</Text>
              </View>
            ))}
            {!catalog.length && <Text style={styles.catalogEmpty}>El administrador todavía no cargó precios de referencia.</Text>}
            <Text style={styles.plansHeading}>{patientId ? 'PLANES DE ESTE PACIENTE' : 'PLANES DE TRATAMIENTO'}</Text>
          </View>
        )}
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
  catalogPanel: { backgroundColor: '#fff', borderColor: '#E8EDF4', borderWidth: 1, borderRadius: 13, padding: 15, marginBottom: 14 },
  catalogHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  catalogEyebrow: { color: '#8592A7', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  catalogTitle: { color: '#2C3C59', fontSize: 14, fontWeight: '800', marginTop: 4 },
  catalogMark: { color: '#3C6BCF', fontSize: 25, fontWeight: '700' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: '#EEF1F5', paddingVertical: 9 },
  priceCopy: { flex: 1 }, priceName: { color: '#45546E', fontSize: 10, fontWeight: '700' },
  priceCategory: { color: '#919DB0', fontSize: 8, marginTop: 3 },
  catalogPrice: { color: '#25835F', fontSize: 10, fontWeight: '800' },
  catalogEmpty: { color: '#8492A6', fontSize: 10, paddingVertical: 12 },
  plansHeading: { color: '#8190A5', fontSize: 8, fontWeight: '800', letterSpacing: 1, borderTopWidth: 1, borderTopColor: '#EEF1F5', paddingTop: 10, marginTop: 2 },
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
