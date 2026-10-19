import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Alert, ActivityIndicator, RefreshControl, TextInput,
} from 'react-native';
import userService from '../../services/userService';
import RoleBadge from '../../components/RoleBadge';
import StatusBadge from '../../components/StatusBadge';
import Button from '../../components/Button';
import Colors from '../../constants/colors';

export default function UsersListScreen({ navigation }) {
  const [users, setUsers]         = useState([]);
  const [filtered, setFiltered]   = useState([]);
  const [search, setSearch]       = useState('');
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
      setFiltered(data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'No se pudo cargar la lista');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    const unsub = navigation.addListener('focus', fetchUsers);
    return unsub;
  }, [fetchUsers, navigation]);

  function handleSearch(text) {
    setSearch(text);
    const q = text.toLowerCase();
    setFiltered(
      users.filter((u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.apellido.toLowerCase().includes(q) ||
        u.correo.toLowerCase().includes(q)
      )
    );
  }

  async function toggleEstado(user) {
    const nuevo = user.estado === 'activo' ? 'inactivo' : 'activo';
    Alert.alert(
      `${nuevo === 'inactivo' ? 'Desactivar' : 'Activar'} usuario`,
      `¿Confirmás ${nuevo === 'inactivo' ? 'desactivar' : 'activar'} a ${user.nombre} ${user.apellido}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          style: nuevo === 'inactivo' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await userService.update(user.id, { estado: nuevo });
              fetchUsers();
            } catch (err) {
              Alert.alert('Error', err.response?.data?.message || 'No se pudo actualizar');
            }
          },
        },
      ]
    );
  }

  function renderUser({ item }) {
    return (
      <View style={[styles.row, item.estado === 'inactivo' && styles.rowInactive]}>
        {/* Avatar */}
        <View style={[styles.avatar, item.estado === 'inactivo' && styles.avatarInactive]}>
          <Text style={styles.avatarText}>{item.nombre[0]}{item.apellido[0]}</Text>
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.name}>{item.nombre} {item.apellido}</Text>
          <Text style={styles.email}>{item.correo}</Text>
          <View style={styles.badges}>
            <RoleBadge rol={item.rol} size="sm" />
            <StatusBadge status={item.estado} />
          </View>
        </View>

        {/* Acciones */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('EditUser', { userId: item.id })}
          >
            <Text style={styles.actionIcon}>✏️</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, item.estado === 'activo' ? styles.deactivateBtn : styles.activateBtn]}
            onPress={() => toggleEstado(item)}
          >
            <Text style={styles.actionIcon}>{item.estado === 'activo' ? '🚫' : '✅'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por nombre o correo..."
          placeholderTextColor={Colors.text.disabled}
          value={search}
          onChangeText={handleSearch}
        />
      </View>

      {/* Contador */}
      <Text style={styles.counter}>
        {filtered.length} {filtered.length === 1 ? 'usuario' : 'usuarios'}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(u) => String(u.id)}
        renderItem={renderUser}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchUsers(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No se encontraron usuarios</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreateUser')}
        accessibilityLabel="Crear nuevo usuario"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
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
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  searchIcon:  { fontSize: 16, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary, paddingVertical: 10 },

  counter: {
    fontSize: 12,
    color: Colors.text.label,
    marginLeft: 16,
    marginBottom: 8,
    fontWeight: '500',
  },

  list: { paddingHorizontal: 16, paddingBottom: 90 },

  row: {
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
  rowInactive: { opacity: 0.55 },

  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInactive: { backgroundColor: Colors.gray[100] },
  avatarText: { fontSize: 15, fontWeight: '700', color: Colors.primary },

  info:   { flex: 1, gap: 3 },
  name:   { fontSize: 14, fontWeight: '600', color: Colors.text.primary },
  email:  { fontSize: 12, color: Colors.text.secondary },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },

  actions:      { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  deactivateBtn: { backgroundColor: Colors.errorLight },
  activateBtn:   { backgroundColor: Colors.successLight },
  actionIcon: { fontSize: 15 },

  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
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
