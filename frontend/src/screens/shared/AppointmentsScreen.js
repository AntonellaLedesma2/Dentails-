import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import appointmentService from '../../services/appointmentService';
import StatusBadge from '../../components/StatusBadge';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

// Días de la semana para el selector de fecha
function buildWeekDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString('es-AR', { weekday: 'short' }),
      date:  d.toISOString().substring(0, 10),
      day:   d.getDate(),
    });
  }
  return days;
}

function formatHora(hora) {
  return hora ? hora.substring(0, 5) : '';
}

export default function AppointmentsScreen({ navigation }) {
  const { user } = useAuth();
  const canCreate = user?.rol === ROLES.ADMINISTRADOR || user?.rol === ROLES.RECEPCION;

  const weekDays  = buildWeekDays();
  const todayStr  = weekDays[0].date;

  const [selectedDate, setSelectedDate]   = useState(todayStr);
  const [appointments, setAppointments]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);

  const fetchAppointments = useCallback(async (date = selectedDate) => {
    try {
      const data = await appointmentService.getAll({ fecha: date });
      setAppointments(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cargar la agenda');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    setLoading(true);
    fetchAppointments(selectedDate);
  }, [selectedDate]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => fetchAppointments(selectedDate));
    return unsub;
  }, [navigation, selectedDate]);

  async function handleCancel(appt) {
    Alert.alert(
      'Cancelar turno',
      `¿Cancelar el turno de ${appt.paciente_nombre}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancelar turno',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentService.cancel(appt.id);
              fetchAppointments(selectedDate);
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'No se pudo cancelar');
            }
          },
        },
      ]
    );
  }

  function renderAppointment({ item }) {
    const isOwnAppt = user?.rol === ROLES.ODONTOLOGO;

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('AppointmentForm', { mode: 'edit', appointmentId: item.id })}
        activeOpacity={0.85}
      >
        {/* Hora y duración */}
        <View style={styles.timeCol}>
          <Text style={styles.hora}>{formatHora(item.hora)}</Text>
          <Text style={styles.duracion}>{item.duracion_min}m</Text>
        </View>

        {/* Info */}
        <View style={styles.infoCol}>
          <Text style={styles.patientName}>{item.paciente_nombre}</Text>
          {item.motivo && <Text style={styles.motivo}>{item.motivo}</Text>}
          {!isOwnAppt && (
            <Text style={styles.odontologo}>🦷 {item.odontologo_nombre}</Text>
          )}
          <StatusBadge status={item.estado} />
        </View>

        {/* Acciones rápidas */}
        {canCreate && item.estado === 'pendiente' && (
          <View style={styles.actionsCol}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.confirmBtn]}
              onPress={async () => {
                try {
                  await appointmentService.changeEstado(item.id, 'confirmado');
                  fetchAppointments(selectedDate);
                } catch {}
              }}
            >
              <Text style={styles.actionBtnText}>✓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.cancelBtn]}
              onPress={() => handleCancel(item)}
            >
              <Text style={styles.actionBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        {user?.rol === ROLES.ODONTOLOGO && item.estado === 'confirmado' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.doneBtn]}
            onPress={async () => {
              try {
                await appointmentService.changeEstado(item.id, 'realizado');
                fetchAppointments(selectedDate);
              } catch {}
            }}
          >
            <Text style={styles.actionBtnText}>✓</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>

      {/* Selector de días */}
      <View style={styles.weekStrip}>
        {weekDays.map((d) => (
          <TouchableOpacity
            key={d.date}
            style={[styles.dayBtn, selectedDate === d.date && styles.dayBtnActive]}
            onPress={() => setSelectedDate(d.date)}
          >
            <Text style={[styles.dayLabel, selectedDate === d.date && styles.dayLabelActive]}>
              {d.label}
            </Text>
            <Text style={[styles.dayNum, selectedDate === d.date && styles.dayNumActive]}>
              {d.day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Fecha seleccionada */}
      <Text style={styles.dateHeader}>
        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-AR', {
          weekday: 'long', day: 'numeric', month: 'long',
        }).replace(/^\w/, (c) => c.toUpperCase())}
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(a) => String(a.id)}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); fetchAppointments(selectedDate); }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📅</Text>
              <Text style={styles.emptyTitle}>Sin turnos para este día</Text>
              {canCreate && (
                <Text style={styles.emptyHint}>Tocá el botón + para agregar un turno</Text>
              )}
            </View>
          }
        />
      )}

      {canCreate && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AppointmentForm', { mode: 'create', fecha: selectedDate })}
          accessibilityLabel="Nuevo turno"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },

  weekStrip: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayBtnActive: { backgroundColor: Colors.primary },
  dayLabel:     { fontSize: 11, color: Colors.text.secondary, fontWeight: '500' },
  dayLabelActive: { color: Colors.white },
  dayNum:       { fontSize: 16, fontWeight: '700', color: Colors.text.primary, marginTop: 2 },
  dayNumActive: { color: Colors.white },

  dateHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text.secondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  list: { paddingHorizontal: 16, paddingBottom: 90 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  timeCol: {
    alignItems: 'center',
    minWidth: 44,
  },
  hora:     { fontSize: 15, fontWeight: '700', color: Colors.primary },
  duracion: { fontSize: 11, color: Colors.text.secondary, marginTop: 2 },

  infoCol:     { flex: 1, gap: 4 },
  patientName: { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  motivo:      { fontSize: 12, color: Colors.text.secondary },
  odontologo:  { fontSize: 12, color: Colors.text.secondary },

  actionsCol: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  confirmBtn: { backgroundColor: Colors.successLight },
  cancelBtn:  { backgroundColor: Colors.errorLight },
  doneBtn:    { backgroundColor: Colors.primaryLight },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: Colors.text.primary },

  empty: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon:  { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.text.primary },
  emptyHint:  { fontSize: 13, color: Colors.text.secondary },

  fab: {
    position: 'absolute',
    bottom: 24, right: 24,
    width: 54, height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { fontSize: 26, color: Colors.white, lineHeight: 30 },
});
