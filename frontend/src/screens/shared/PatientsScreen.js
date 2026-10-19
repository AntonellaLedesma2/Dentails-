import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import patientService from '../../services/patientService';
import StatusBadge from '../../components/StatusBadge';
import Colors from '../../constants/colors';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../constants/roles';

function calcAge(fechaNacimiento) {
  if (!fechaNacimiento) return null;
  const diff = Date.now() - new Date(fechaNacimiento).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}

export default function PatientsScreen({ navigation }) {
  const { user } = useAuth();
  const canEdit = user?.rol === ROLES.ADMINISTRADOR || user?.rol === ROLES.RECEPCION;

  const [patients, setPatients]   = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPatients = useCallback(async () => {
    try {
      const data = await patientService.getAll();
      setPatients(data);
      setFiltered(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cargar la lista');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPatients();
    const unsub = navigation.addListener('focus', fetchPatients);
    return unsub;
  }, [fetchPatients, navigation]);

  function handleSearch(text) {
    setSearch(text);
    const q = text.toLowerCase();
    setFiltered(
      patients.filter((p) =>
        p.nombre.toLowerCase().includes(q) ||
        p.apellido.toLowerCase().includes(q) ||
        (p.dni && p.dni.includes(q)) ||
        (p.telefono && p.telefono.includes(q))
      )
    );
  }

  function renderPatient({ item }) {
    const age = calcAge(item.fecha_nacimiento);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('PatientDetail', { patientId: item.id })}
        accessibilityRole="button"
      >
        <View style={styles.cardLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.nombre[0]}{item.apellido[0]}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.name}>{item.apellido}, {item.nombre}</Text>
          <View style={styles.metaRow}>
            {item.dni && <Text style={styles.meta}>DNI {item.dni}</Text>}
            {age !== null && <Text style={styles.meta}>• {age} años</Text>}
          </View>
          {item.telefono && <Text style={styles.meta}>📞 {item.telefono}</Text>}
          {item.obra_social && <Text style={styles.meta}>🏥 {item.obra_social}</Text>}
        </View>

        <View style={styles.cardRight}>
          <Text style={styles.chevron}>›</Text>
        </View>
      </TouchableOpacity>
    );
  }

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={Colors.primary} /></View>;
  }

  return (
    <View style={styles.container}>
      {/* Búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre, DNI o teléfono..."
          placeholderTextColor={Colors.text.disabled}
          value={search}
          onChangeText={handleSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.counter}>{filtered.length} {filtered.length === 1 ? 'paciente' : 'pacientes'}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(p) => String(p.id)}
        renderItem={renderPatient}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchPatients(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🦷</Text>
            <Text style={styles.emptyText}>No se encontraron pacientes</Text>
          </View>
        }
      />

      {canEdit && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('PatientForm', { mode: 'create' })}
          accessibilityLabel="Agregar paciente"
        >
          <Text style={styles.fabIcon}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  centered:  { flex: 1, alignItems: 'center', justifyContent: 'center' },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    margin: 16,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon:  { fontSize: 15, marginRight: 8, color: Colors.text.secondary },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary, paddingVertical: 11 },
  clearBtn:    { fontSize: 14, color: Colors.text.secondary, padding: 4 },

  counter: {
    fontSize: 12,
    color: Colors.text.label,
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: '500',
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
  },
  cardLeft:  { marginRight: 12 },
  cardBody:  { flex: 1, gap: 3 },
  cardRight: { marginLeft: 8 },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  name:    { fontSize: 15, fontWeight: '600', color: Colors.text.primary },
  metaRow: { flexDirection: 'row', gap: 4 },
  meta:    { fontSize: 12, color: Colors.text.secondary },
  chevron: { fontSize: 22, color: Colors.gray[300] },

  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { fontSize: 14, color: Colors.text.secondary },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  fabIcon: { fontSize: 26, color: Colors.white, lineHeight: 30 },
});
