import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TrackedScrollView } from '../../components/TrackedScroll';
import Button from '../../components/Button';
import Input from '../../components/Input';
import appointmentService from '../../services/appointmentService';
import userService from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useAppUi } from '../../context/AppUiContext';

function todayLocal() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function PatientAppointmentRequestScreen() {
  const { user, logout } = useAuth();
  const { colors } = useAppUi();
  const [dentists, setDentists] = useState([]);
  const [dentistId, setDentistId] = useState('');
  const [fecha, setFecha] = useState(todayLocal());
  const [hora, setHora] = useState('');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let active = true;
    userService.getDentists()
      .then((items) => { if (active) setDentists(items); })
      .catch((err) => { if (active) setError(err.response?.data?.message || 'No se pudieron cargar los odontólogos.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function submit() {
    setError(''); setSuccess('');
    if (!dentistId) { setError('Elegí un odontólogo.'); return; }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || fecha < todayLocal()) { setError('Elegí una fecha válida desde hoy.'); return; }
    const normalizedTime = hora.replace(/\D/g, '').slice(0, 4);
    if (normalizedTime.length !== 4 || Number(normalizedTime.slice(0, 2)) > 23 || Number(normalizedTime.slice(2)) > 59) { setError('Ingresá una hora válida, por ejemplo 09:30.'); return; }

    setSubmitting(true);
    try {
      await appointmentService.create({
        odontologoId: Number(dentistId), fecha,
        hora: `${normalizedTime.slice(0, 2)}:${normalizedTime.slice(2)}`,
        duracionMin: 30, motivo: motivo.trim() || null,
      });
      setSuccess('Tu solicitud fue enviada. Recepción se comunicará para confirmarla.');
      setHora(''); setMotivo('');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo enviar la solicitud. Intentá nuevamente.');
    } finally { setSubmitting(false); }
  }

  return (
    <TrackedScrollView style={[styles.screen, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.topRow}>
        <View><Text style={[styles.brand, { color: colors.primary }]}>DENTALIS</Text><Text style={[styles.patientName, { color: colors.text }]}>Hola, {user?.nombre}</Text></View>
        <TouchableOpacity onPress={logout} accessibilityRole="button" style={[styles.logout, { borderColor: colors.border }]}><Text style={{ color: colors.muted, fontWeight: '600' }}>Salir</Text></TouchableOpacity>
      </View>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Solicitar una cita</Text>
        <Text style={[styles.subtitle, { color: colors.muted }]}>Elegí un odontólogo y un horario que te quede cómodo. Recepción confirmará la cita.</Text>
        <Text style={[styles.label, { color: colors.muted }]}>Odontólogo *</Text>
        {loading ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : (
          <View style={styles.doctorList}>
            {dentists.map((doctor) => {
              const selected = String(doctor.id) === dentistId;
              return <TouchableOpacity key={doctor.id} onPress={() => setDentistId(String(doctor.id))} style={[styles.doctorChip, { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.soft : colors.surface }]} accessibilityRole="button" accessibilityState={{ selected }}>
                <Text style={{ color: selected ? colors.primary : colors.text, fontWeight: selected ? '700' : '500' }}>Dr/a. {doctor.nombre} {doctor.apellido}</Text>
              </TouchableOpacity>;
            })}
            {!dentists.length && !error ? <Text style={[styles.helper, { color: colors.muted }]}>No hay odontólogos disponibles en este momento.</Text> : null}
          </View>
        )}
        <Input label="Fecha * (AAAA-MM-DD)" value={fecha} onChangeText={setFecha} placeholder={todayLocal()} keyboardType="numeric" />
        <Input label="Hora * (HH:MM)" value={hora} onChangeText={setHora} placeholder="09:30" keyboardType="numeric" />
        <Input label="Motivo de la consulta (opcional)" value={motivo} onChangeText={setMotivo} placeholder="Control, limpieza, consulta..." multiline />
        {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}
        {success ? <Text accessibilityRole="status" style={styles.success}>{success}</Text> : null}
        <Button title="Enviar solicitud" onPress={submit} loading={submitting} disabled={loading || !dentists.length} size="lg" style={styles.submit} />
      </View>
    </TrackedScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 }, content: { flexGrow: 1, padding: 20, justifyContent: 'center' },
  topRow: { width: '100%', maxWidth: 620, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  brand: { fontSize: 13, fontWeight: '900', letterSpacing: 2 }, patientName: { fontSize: 19, fontWeight: '700', marginTop: 4 },
  logout: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10 },
  card: { width: '100%', maxWidth: 620, alignSelf: 'center', padding: 22, borderWidth: 1, borderRadius: 16 },
  title: { fontSize: 23, fontWeight: '800' }, subtitle: { fontSize: 13, lineHeight: 19, marginTop: 6, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', marginBottom: 8 }, doctorList: { gap: 8, marginBottom: 18 },
  doctorChip: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12 },
  spinner: { marginVertical: 18 }, helper: { fontSize: 13, marginBottom: 12 }, error: { color: '#C62835', fontSize: 13, lineHeight: 19, marginTop: 6 },
  success: { color: '#16784F', fontSize: 13, lineHeight: 19, marginTop: 8 }, submit: { marginTop: 16 },
});
