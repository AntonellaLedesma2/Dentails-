import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { TrackedFlatList } from '../../components/TrackedScroll';
import appointmentService from '../../services/appointmentService';
import { useAppUi } from '../../context/AppUiContext';

function displayDate(value) {
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? String(value || '') : date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

export default function AppointmentRequestsScreen() {
  const { colors } = useAppUi();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError('');
    try { setRequests(await appointmentService.getRequests()); }
    catch (err) { setError(err.response?.data?.message || 'No se pudieron cargar las solicitudes.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function resolveRequest(item, estado) {
    setBusyId(item.id);
    setError('');
    try {
      await appointmentService.changeEstado(item.id, estado);
      setRequests((current) => current.filter((request) => request.id !== item.id));
    } catch (err) { setError(err.response?.data?.message || 'No se pudo actualizar la solicitud.'); }
    finally { setBusyId(null); }
  }

  function renderRequest({ item }) {
    const busy = busyId === item.id;
    return (
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.cardHeading}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.patient, { color: colors.text }]}>{item.paciente_nombre}</Text>
            <Text style={[styles.meta, { color: colors.muted }]}>Solicita Dr/a. {item.solicitante_nombre || item.odontologo_nombre}</Text>
          </View>
          <Text style={styles.pending}>Pendiente</Text>
        </View>
        <Text style={[styles.detail, { color: colors.text }]}>{displayDate(item.fecha)} · {String(item.hora).slice(0, 5)} · {item.duracion_min} min</Text>
        {item.motivo ? <Text style={[styles.meta, { color: colors.muted }]}>Motivo: {item.motivo}</Text> : null}
        <View style={styles.actions}>
          <TouchableOpacity disabled={busy} style={[styles.rejectButton, busy && styles.disabled]} onPress={() => resolveRequest(item, 'cancelado')} accessibilityRole="button">
            <Text style={styles.rejectText}>{busy ? 'Procesando…' : 'Rechazar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={busy} style={[styles.confirmButton, busy && styles.disabled]} onPress={() => resolveRequest(item, 'confirmado')} accessibilityRole="button">
            <Text style={styles.confirmText}>{busy ? 'Procesando…' : 'Confirmar cita'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;

  return (
    <TrackedFlatList
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={requests}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderRequest}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
      ListHeaderComponent={error ? <Text style={styles.error}>{error}</Text> : null}
      ListEmptyComponent={<View style={[styles.empty, { backgroundColor: colors.surface, borderColor: colors.border }]}><Text style={styles.emptyIcon}>◷</Text><Text style={[styles.emptyTitle, { color: colors.text }]}>No hay solicitudes pendientes</Text><Text style={[styles.meta, { color: colors.muted }]}>Las nuevas citas propuestas por odontología aparecerán aquí.</Text></View>}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 }, content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { padding: 16, borderWidth: 1, borderRadius: 14, marginBottom: 12, gap: 8 },
  cardHeading: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 }, patient: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, lineHeight: 19 }, detail: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  pending: { backgroundColor: '#FFF2D2', color: '#946200', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, fontSize: 11, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 8 }, rejectButton: { flex: 1, borderWidth: 1, borderColor: '#D64B55', borderRadius: 9, padding: 12, alignItems: 'center' }, rejectText: { color: '#C42D38', fontWeight: '700' },
  confirmButton: { flex: 1, backgroundColor: '#2458D3', borderRadius: 9, padding: 12, alignItems: 'center' }, confirmText: { color: '#FFFFFF', fontWeight: '700' }, disabled: { opacity: 0.55 },
  empty: { flex: 1, minHeight: 220, borderWidth: 1, borderRadius: 14, padding: 24, alignItems: 'center', justifyContent: 'center', gap: 8 }, emptyIcon: { fontSize: 34, color: '#2458D3' }, emptyTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' }, error: { color: '#C42D38', marginBottom: 12 },
});
