import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  FlatList, TextInput,
} from 'react-native';
import { OBRAS_SOCIALES } from '../constants/obrasSociales';
import Colors from '../constants/colors';

export default function ObraSocialPicker({ value, onChange, label = 'Obra social' }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch]             = useState('');

  const filtered = OBRAS_SOCIALES.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const selectedLabel = OBRAS_SOCIALES.find((o) => o.value === value)?.label
    || (value ? value : 'Sin obra social');

  function handleSelect(item) {
    onChange(item.value);
    setModalVisible(false);
    setSearch('');
  }

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TouchableOpacity
        style={styles.selector}
        onPress={() => setModalVisible(true)}
        accessibilityLabel={`Seleccionar obra social: ${selectedLabel}`}
      >
        <Text style={[styles.selectorText, !value && styles.placeholder]}>
          {value ? selectedLabel : 'Seleccioná una obra social...'}
        </Text>
        <Text style={styles.chevron}>⌄</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Obra social</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setSearch(''); }}>
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={styles.searchBar}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar obra social..."
                placeholderTextColor={Colors.text.disabled}
                value={search}
                onChangeText={setSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')}>
                  <Text style={styles.clearBtn}>✕</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Lista */}
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.value || 'particular'}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.item,
                    value === item.value && styles.itemActive,
                  ]}
                  onPress={() => handleSelect(item)}
                >
                  <Text style={[
                    styles.itemText,
                    value === item.value && styles.itemTextActive,
                  ]}>
                    {item.label}
                  </Text>
                  {value === item.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>No se encontraron resultados</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:   { marginBottom: 16 },
  label: {
    fontSize: 13, fontWeight: '600',
    color: Colors.text.secondary,
    marginBottom: 6, letterSpacing: 0.3,
  },
  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 46,
  },
  selectorText: { fontSize: 15, color: Colors.text.primary, flex: 1 },
  placeholder:  { color: Colors.text.disabled },
  chevron:      { fontSize: 18, color: Colors.text.secondary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: Colors.text.primary },
  closeBtn:   { fontSize: 18, color: Colors.text.secondary, padding: 4 },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  searchIcon:  { fontSize: 15, marginRight: 8, color: Colors.text.secondary },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text.primary, paddingVertical: 10 },
  clearBtn:    { fontSize: 14, color: Colors.text.secondary, padding: 4 },

  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  itemActive:     { backgroundColor: Colors.primaryLight },
  itemText:       { fontSize: 15, color: Colors.text.primary },
  itemTextActive: { color: Colors.primary, fontWeight: '600' },
  checkmark:      { fontSize: 16, color: Colors.primary, fontWeight: '700' },

  empty:     { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.text.secondary },
});
