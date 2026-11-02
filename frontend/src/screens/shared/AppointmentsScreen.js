import React, { useEffect, useState, useCallback } from 'react';
import { TrackedScrollView, TrackedFlatList } from '../../components/TrackedScroll';
import {
  View, Text, StyleSheet, TouchableOpacity, useWindowDimensions,
  Alert, ActivityIndicator, RefreshControl, Modal,
} from 'react-native';
import appointmentService from '../../services/appointmentService';
import StatusBadge from '../../components/StatusBadge';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { useAppUi } from '../../context/AppUiContext';
import Button from '../../components/Button';

// Días de la semana para el selector de fecha
function buildWeekDays() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: d.toLocaleDateString('es-AR', { weekday: 'short' }),
      date:  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
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
  const { colors } = useAppUi();
  const { width } = useWindowDimensions();
  const showBoard = width >= 1050 && user?.rol !== ROLES.ODONTOLOGO;
  const canCreate = user?.rol === ROLES.ADMINISTRADOR || user?.rol === ROLES.RECEPCION;
  const canRequest = user?.rol === ROLES.ODONTOLOGO;

  const weekDays  = buildWeekDays();
  const todayStr  = weekDays[0].date;

  const [selectedDate, setSelectedDate]   = useState(todayStr);
  const [appointments, setAppointments]   = useState([]);
  const [loading, setLoading]             = useState(true);
  const [refreshing, setRefreshing]       = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState('');

  const doctorColumns = [...new Map(appointments.map((item) => [String(item.odontologo_id), {
    id: item.odontologo_id,
    name: item.odontologo_nombre || 'Odontólogo',
  }])).values()].map((doctor) => ({
    ...doctor,
    appointments: appointments.filter((item) => String(item.odontologo_id) === String(doctor.id)),
  }));

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
    const initialLoad = setTimeout(() => fetchAppointments(selectedDate), 0);
    return () => clearTimeout(initialLoad);
  }, [fetchAppointments, selectedDate]);

  useEffect(() => {
    const unsub = navigation.addListener('focus', fetchAppointments);
    return unsub;
  }, [navigation, fetchAppointments]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelLoading(true);
    setCancelError('');
    try {
      await appointmentService.cancel(cancelTarget.id);
      setCancelTarget(null);
      fetchAppointments(selectedDate);
    } catch (err) {
      setCancelError(err.response?.data?.message || 'No se pudo cancelar el turno.');
    } finally {
      setCancelLoading(false);
    }
  }

  const canManageAppointment = (item) => user?.rol === ROLES.ADMINISTRADOR && ['pendiente', 'confirmado', 'reprogramado'].includes(item.estado);

  function renderAppointment({ item }) {
    const isOwnAppt = user?.rol === ROLES.ODONTOLOGO;

    return (
      <View style={styles.card}>
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
          </View>
        )}
        {canManageAppointment(item) && (
          <View style={styles.actionsCol}>
            <TouchableOpacity style={[styles.actionBtn, styles.editBtn]} onPress={() => navigation.navigate('AppointmentForm', { mode: 'edit', appointmentId: item.id })} accessibilityLabel="Editar turno">
              <Text style={styles.actionBtnText}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.cancelBtn]} onPress={() => { setCancelError(''); setCancelTarget(item); }} accessibilityLabel="Cancelar turno">
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
      </View>
    );
  }

  function renderBoardAppointment(item) {
    const stateColor = item.estado === 'confirmado' ? '#21845F' : item.estado === 'cancelado' ? '#C96870' : '#B67A1A';
    return (
      <TouchableOpacity key={item.id} style={[styles.boardAppointment, item.estado === 'realizado' && styles.boardDone]} activeOpacity={0.8}
        onPress={canCreate ? () => navigation.navigate('AppointmentForm', { mode: 'edit', appointmentId: item.id }) : () => navigation.navigate('PatientDetail', { patientId: item.paciente_id })}>
        <View style={styles.boardTime}><Text style={styles.boardTimeText}>{formatHora(item.hora)}</Text></View>
        <Text style={styles.boardPatient} numberOfLines={1}>{item.paciente_nombre}</Text>
        <Text style={styles.boardReason} numberOfLines={2}>{item.motivo || 'Consulta odontológica'}</Text>
        <View style={styles.boardFoot}><Text style={[styles.boardStatus, { color: stateColor }]}>{item.estado}</Text><Text style={styles.boardDuration}>{item.duracion_min} min</Text></View>
        {canCreate && <View style={styles.boardActions}>
          {item.estado === 'pendiente' && <TouchableOpacity style={styles.boardConfirm} onPress={async () => { try { await appointmentService.changeEstado(item.id, 'confirmado'); fetchAppointments(selectedDate); } catch (err) { Alert.alert('Error', err.response?.data?.message || 'No se pudo confirmar el turno'); } }}><Text style={styles.boardConfirmText}>Confirmar</Text></TouchableOpacity>}
          {canManageAppointment(item) && <TouchableOpacity style={styles.boardEdit} onPress={() => navigation.navigate('AppointmentForm', { mode: 'edit', appointmentId: item.id })}><Text style={styles.boardEditText}>Editar</Text></TouchableOpacity>}
          {canManageAppointment(item) && <TouchableOpacity style={styles.boardCancel} onPress={() => { setCancelError(''); setCancelTarget(item); }}><Text style={styles.boardCancelText}>Cancelar</Text></TouchableOpacity>}
        </View>}
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
            onPress={() => { if (selectedDate !== d.date) setLoading(true); setSelectedDate(d.date); }}
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
      ) : showBoard ? (
        <TrackedScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={styles.board}>
          {doctorColumns.length ? doctorColumns.map((doctor) => (
            <View key={doctor.id} style={styles.doctorColumn}>
              <View style={styles.doctorColumnHeader}><View style={styles.doctorAvatar}><Text style={styles.doctorAvatarText}>{doctor.name[0]}</Text></View><View style={{ flex: 1 }}><Text style={styles.doctorColumnName} numberOfLines={1}>Dr/a. {doctor.name}</Text><Text style={styles.doctorColumnMeta}>{doctor.appointments.length} turnos</Text></View></View>
              {doctor.appointments.map(renderBoardAppointment)}
              {!doctor.appointments.length && <Text style={styles.boardEmpty}>Agenda libre</Text>}
            </View>
          )) : <View style={styles.empty}><Text style={styles.emptyIcon}>📅</Text><Text style={styles.emptyTitle}>Sin turnos para este día</Text></View>}
        </TrackedScrollView>
      ) : (
        <TrackedFlatList
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

      {(canCreate || canRequest) && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('AppointmentForm', { mode: 'create', fecha: selectedDate })}
          accessibilityLabel={canRequest ? 'Solicitar turno' : 'Nuevo turno'}
        >
          <Text style={styles.fabIcon}>{canRequest ? '＋' : '+'}</Text>
        </TouchableOpacity>
      )}

      <Modal visible={Boolean(cancelTarget)} transparent animationType="fade" onRequestClose={() => !cancelLoading && setCancelTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Cancelar turno</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>¿Querés cancelar el turno de {cancelTarget?.paciente_nombre}? Esta acción quedará registrada en el historial.</Text>
            {cancelError ? <Text style={styles.modalError}>{cancelError}</Text> : null}
            <View style={styles.modalActions}>
              <Button title="Volver" variant="outline" onPress={() => setCancelTarget(null)} disabled={cancelLoading} style={styles.modalButton} />
              <Button title="Sí, cancelar" onPress={handleCancel} loading={cancelLoading} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
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
  board: { paddingHorizontal: 14, paddingBottom: 30, gap: 12, alignItems: 'flex-start' },
  doctorColumn: { width: 245, minHeight: 370, backgroundColor: '#EDF2F9', borderRadius: 12, padding: 9 },
  doctorColumnHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 6, paddingBottom: 10 },
  doctorAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#DFE9FA', justifyContent: 'center', alignItems: 'center' },
  doctorAvatarText: { color: '#3569D3', fontSize: 11, fontWeight: '800' }, doctorColumnName: { color: '#36455F', fontSize: 10, fontWeight: '800' }, doctorColumnMeta: { color: '#8B98AC', fontSize: 8, marginTop: 3 },
  boardAppointment: { backgroundColor: '#FFFFFF', borderRadius: 9, padding: 11, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#4A78D4', borderWidth: 1, borderColor: '#E6EBF3' },
  boardDone: { borderLeftColor: '#28A478' }, boardTime: { alignSelf: 'flex-start', backgroundColor: '#EDF3FE', borderRadius: 5, paddingHorizontal: 7, paddingVertical: 4, marginBottom: 7 }, boardTimeText: { color: '#3D6BCB', fontSize: 9, fontWeight: '800' },
  boardPatient: { color: '#394962', fontSize: 10, fontWeight: '800' }, boardReason: { color: '#8794A8', fontSize: 8, lineHeight: 12, marginTop: 4 }, boardFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }, boardStatus: { fontSize: 8, fontWeight: '800', textTransform: 'capitalize' }, boardDuration: { color: '#A0AABB', fontSize: 8 }, boardConfirm: { alignSelf: 'flex-end', marginTop: 8, borderRadius: 5, backgroundColor: '#E7F7F0', paddingHorizontal: 8, paddingVertical: 5 }, boardConfirmText: { color: '#21845F', fontSize: 8, fontWeight: '800' }, boardEmpty: { color: '#97A2B3', textAlign: 'center', fontSize: 9, paddingTop: 25 },

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
  editBtn: { backgroundColor: Colors.primaryLight },
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
  boardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  boardEdit: { borderRadius: 5, backgroundColor: '#EDF3FE', paddingHorizontal: 8, paddingVertical: 5 },
  boardEditText: { color: '#3D6BCB', fontSize: 8, fontWeight: '800' },
  boardCancel: { borderRadius: 5, backgroundColor: '#FCEAEC', paddingHorizontal: 8, paddingVertical: 5 },
  boardCancelText: { color: '#B74655', fontSize: 8, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(8,15,28,0.56)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 440, borderRadius: 18, borderWidth: 1, padding: 22 },
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  modalMessage: { fontSize: 14, lineHeight: 21 },
  modalError: { color: '#C53E4B', fontSize: 13, marginTop: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  modalButton: { minWidth: 120 },
});
