import React, { useCallback, useEffect, useState } from 'react';
import { TrackedScrollView } from '../../components/TrackedScroll';
import {
  View, Text, StyleSheet, Alert, ActivityIndicator, Modal,
} from 'react-native';
import patientService from '../../services/patientService';
import clinicalRecordService from '../../services/clinicalRecordService';
import Odontogram from '../../components/Odontogram';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';
import { useAppUi } from '../../context/AppUiContext';

function Row({ label, value }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

function calcAge(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const diff = Date.now() - new Date(fechaNacimiento).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function PatientDetailScreen({ route, navigation }) {
  const { patientId } = route.params;
  const { user } = useAuth();
  const { colors } = useAppUi();
  const canEdit   = user?.rol === ROLES.ADMINISTRADOR || user?.rol === ROLES.RECEPCION;
  const canDeact  = user?.rol === ROLES.ADMINISTRADOR;
  const isOdonto  = user?.rol === ROLES.ODONTOLOGO;

  const [patient, setPatient] = useState(null);
  const [odontograma, setOdontograma] = useState({});
  const [loading, setLoading] = useState(true);
  const [statusDialog, setStatusDialog] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  const load = useCallback(async () => {
    try {
      const [data, clinical] = await Promise.all([
        patientService.getById(patientId),
        isOdonto ? clinicalRecordService.getRecord(patientId) : Promise.resolve(null),
      ]);
      setPatient(data);
      if (clinical) setOdontograma(clinical.odontograma || {});
      navigation.setOptions({ title: `${data.apellido}, ${data.nombre}` });
    } catch {
      Alert.alert('Error', 'No se pudo cargar el paciente');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [patientId, isOdonto, navigation]);

  useEffect(() => {
  const timer = setTimeout(() => {
    void load();
  }, 0);

  const unsubscribe = navigation.addListener('focus', load);

  return () => {
    clearTimeout(timer);
    unsubscribe();
  };
}, [load, navigation]);

  async function handleStatusChange() {
    const estado = patient.estado === 'activo' ? 'inactivo' : 'activo';
    setStatusLoading(true);
    setStatusError('');
    try {
      await patientService.setStatus(patientId, estado);
      setPatient((current) => ({ ...current, estado }));
      setStatusDialog(false);
    } catch (err) {
      setStatusError(err.response?.data?.message || 'No se pudo actualizar el estado. Revisá la conexión e intentá de nuevo.');
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const age = calcAge(patient.fecha_nacimiento);
  const fechaNac = patient.fecha_nacimiento
    ? new Date(patient.fecha_nacimiento).toLocaleDateString('es-AR')
    : null;

  return (
    <TrackedScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>

      {/* Header del paciente */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patient.nombre[0]}{patient.apellido[0]}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>{patient.apellido}, {patient.nombre}</Text>
          {patient.dni && <Text style={styles.patientMeta}>DNI {patient.dni}</Text>}
          {age !== null && <Text style={styles.patientMeta}>{age} años</Text>}
          <Text style={[styles.statusBadge, { backgroundColor: patient.estado === 'activo' ? '#DDF7EB' : '#FDEBEC', color: patient.estado === 'activo' ? '#087443' : '#B42332' }]}>{patient.estado === 'activo' ? 'Activo' : 'Inactivo'}</Text>
        </View>
      </View>

      {/* Acciones rápidas (odontólogo) */}
      {isOdonto && (
        <View style={styles.actionsRow}>
          <Button
            title="Ver ficha clínica"
            onPress={() => navigation.navigate('ClinicalRecords', { patientId })}
            icon="📋"
            style={styles.actionBtn}
            size="sm"
          />
          <Button
            title="Tratamientos"
            onPress={() => navigation.navigate('Treatments', { patientId })}
            icon="💊"
            variant="ghost"
            style={styles.actionBtn}
            size="sm"
          />
        </View>
      )}

      {isOdonto && (
        <Card title="Odontograma del paciente" style={styles.card}>
          <Odontogram estados={odontograma} readOnly />
          <Button title="Abrir ficha clínica completa" onPress={() => navigation.navigate('ClinicalRecords', { patientId })} variant="ghost" size="sm" style={{ marginTop: 10 }} />
        </Card>
      )}

      {/* Datos personales */}
      <Card title="Datos personales" style={styles.card}>
        <Row label="Fecha de nac." value={fechaNac} />
        <Row label="Sexo"          value={patient.sexo} />
        <Row label="Teléfono"      value={patient.telefono} />
        <Row label="Correo"        value={patient.correo} />
        <Row label="Dirección"     value={patient.direccion} />
      </Card>

      {/* Obra social */}
      {(patient.obra_social || patient.nro_afiliado) && (
        <Card title="Obra social" style={styles.card}>
          <Row label="Obra social"  value={patient.obra_social} />
          <Row label="Nro. afil."   value={patient.nro_afiliado} />
        </Card>
      )}

      {/* Observaciones */}
      {patient.observaciones && (
        <Card title="Observaciones" style={styles.card}>
          <Text style={styles.observaciones}>{patient.observaciones}</Text>
        </Card>
      )}

      {/* Botones de edición */}
      {canEdit && (
        <Button
          title="Editar paciente"
          onPress={() => navigation.navigate('PatientForm', { mode: 'edit', patientId })}
          variant="outline"
          icon="✏️"
          style={styles.editBtn}
        />
      )}
      {canDeact && (
        <Button
          title={patient.estado === 'activo' ? 'Desactivar paciente' : 'Reactivar paciente'}
          onPress={() => { setStatusError(''); setStatusDialog(true); }}
          variant={patient.estado === 'activo' ? 'danger' : 'success'}
          icon={patient.estado === 'activo' ? '🚫' : '✅'}
          style={styles.deactBtn}
        />
      )}

      <Modal visible={statusDialog} transparent animationType="fade" onRequestClose={() => !statusLoading && setStatusDialog(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{patient.estado === 'activo' ? 'Desactivar paciente' : 'Reactivar paciente'}</Text>
            <Text style={[styles.modalMessage, { color: colors.muted }]}>
              {patient.estado === 'activo'
                ? `¿Querés desactivar a ${patient.nombre} ${patient.apellido}? Se conservarán su ficha y su historial, pero no podrá ingresar a su cuenta.`
                : `¿Querés volver a activar a ${patient.nombre} ${patient.apellido}? También se habilitará su cuenta asociada.`}
            </Text>
            {statusError ? <Text accessibilityRole="alert" style={styles.modalError}>{statusError}</Text> : null}
            <View style={styles.modalActions}>
              <Button title="Cancelar" variant="outline" onPress={() => setStatusDialog(false)} disabled={statusLoading} style={styles.modalButton} />
              <Button title={patient.estado === 'activo' ? 'Desactivar' : 'Reactivar'} variant={patient.estado === 'activo' ? 'danger' : 'success'} onPress={handleStatusChange} loading={statusLoading} style={styles.modalButton} />
            </View>
          </View>
        </View>
      </Modal>
    </TrackedScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:   { width: '100%', maxWidth: 1080, alignSelf: 'center', padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText:   { fontSize: 20, fontWeight: '700', color: Colors.primary },
  headerInfo:   { flex: 1 },
  patientName:  { fontSize: 18, fontWeight: '700', color: Colors.text.primary },
  patientMeta:  { fontSize: 13, color: Colors.text.secondary, marginTop: 2 },
  statusBadge: { alignSelf: 'flex-start', overflow: 'hidden', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, fontSize: 11, fontWeight: '700', marginTop: 5 },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn:  { flex: 1 },

  card: { marginBottom: 12 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowLabel: { fontSize: 13, color: Colors.text.secondary, flex: 1 },
  rowValue: { fontSize: 13, color: Colors.text.primary, fontWeight: '500', flex: 2, textAlign: 'right' },

  observaciones: { fontSize: 14, color: Colors.text.primary, lineHeight: 20 },

  editBtn:  { marginTop: 8,  marginBottom: 8 },
  deactBtn: { marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(8,15,28,0.56)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  modalCard: { width: '100%', maxWidth: 440, borderRadius: 18, borderWidth: 1, padding: 22 },
  modalTitle: { fontSize: 19, fontWeight: '800', marginBottom: 8 },
  modalMessage: { fontSize: 14, lineHeight: 21 },
  modalError: { color: '#C53E4B', fontSize: 13, marginTop: 12 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 20 },
  modalButton: { minWidth: 120 },
});
