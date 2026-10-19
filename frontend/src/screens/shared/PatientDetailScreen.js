import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, ActivityIndicator,
} from 'react-native';
import patientService from '../../services/patientService';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

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
  const canEdit   = user?.rol === ROLES.ADMINISTRADOR || user?.rol === ROLES.RECEPCION;
  const canDeact  = user?.rol === ROLES.ADMINISTRADOR;
  const isOdonto  = user?.rol === ROLES.ODONTOLOGO;

  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
    const unsub = navigation.addListener('focus', load);
    return unsub;
  }, [patientId]);

  async function load() {
    try {
      const data = await patientService.getById(patientId);
      setPatient(data);
      navigation.setOptions({ title: `${data.apellido}, ${data.nombre}` });
    } catch {
      Alert.alert('Error', 'No se pudo cargar el paciente');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  async function handleDeactivate() {
    Alert.alert('Desactivar paciente', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desactivar',
        style: 'destructive',
        onPress: async () => {
          try {
            await patientService.deactivate(patientId);
            navigation.goBack();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'No se pudo desactivar');
          }
        },
      },
    ]);
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  const age = calcAge(patient.fecha_nacimiento);
  const fechaNac = patient.fecha_nacimiento
    ? new Date(patient.fecha_nacimiento).toLocaleDateString('es-AR')
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Header del paciente */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{patient.nombre[0]}{patient.apellido[0]}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.patientName}>{patient.apellido}, {patient.nombre}</Text>
          {patient.dni && <Text style={styles.patientMeta}>DNI {patient.dni}</Text>}
          {age !== null && <Text style={styles.patientMeta}>{age} años</Text>}
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
      {canDeact && patient.estado === 'activo' && (
        <Button
          title="Desactivar paciente"
          onPress={handleDeactivate}
          variant="danger"
          icon="🚫"
          style={styles.deactBtn}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content:   { padding: 16, paddingBottom: 40 },

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
});
