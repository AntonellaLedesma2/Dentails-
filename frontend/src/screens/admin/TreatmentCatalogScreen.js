import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, FlatList, Modal, ScrollView, StyleSheet, Text,
  TouchableOpacity, useWindowDimensions, View,
} from 'react-native';
import Button from '../../components/Button';
import Input from '../../components/Input';
import treatmentCatalogService from '../../services/treatmentCatalogService';
import Colors from '../../constants/colors';

const EMPTY = { nombre: '', categoria: '', descripcion: '', precio: '', duracionMin: '30' };
const currency = (value) => `Gs. ${Number(value || 0).toLocaleString('es-PY')}`;

export default function TreatmentCatalogScreen() {
  const { width } = useWindowDimensions();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);

  const load = useCallback(async () => {
    try { setItems(await treatmentCatalogService.getAll()); }
    catch (error) { Alert.alert('Error', error.response?.data?.message || 'No se pudo cargar el catálogo'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openForm(item = null) {
    setEditing(item);
    setForm(item ? {
      nombre: item.nombre, categoria: item.categoria, descripcion: item.descripcion || '',
      precio: String(item.precio), duracionMin: String(item.duracion_min || 30),
    } : EMPTY);
    setModal(true);
  }

  async function save() {
    if (!form.nombre.trim() || !Number.isFinite(Number(form.precio)) || Number(form.precio) < 0) {
      Alert.alert('Revisá el formulario', 'Ingresá un nombre y un precio válido.');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, nombre: form.nombre.trim(), precio: Number(form.precio), duracionMin: Number(form.duracionMin) || 30 };
      if (editing) await treatmentCatalogService.update(editing.id, payload);
      else await treatmentCatalogService.create(payload);
      setModal(false);
      await load();
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'No se pudo guardar el precio');
    } finally { setSaving(false); }
  }

  async function toggleActive(item) {
    try {
      await treatmentCatalogService.update(item.id, { activo: !item.activo });
      await load();
    } catch (error) { Alert.alert('Error', error.response?.data?.message || 'No se pudo actualizar'); }
  }

  if (loading) return <View style={s.centered}><ActivityIndicator color={Colors.primary} size="large" /></View>;

  return (
    <View style={s.container}>
      <View style={s.intro}>
        <View style={s.introCopy}>
          <Text style={s.eyebrow}>ARANCELARIO DE LA CLÍNICA</Text>
          <Text style={s.title}>Tratamientos y precios</Text>
          <Text style={s.subtitle}>Precios de referencia que puede consultar el equipo odontológico.</Text>
        </View>
        <TouchableOpacity style={s.addButton} onPress={() => openForm()}>
          <Text style={s.addLabel}>＋ {width > 620 ? 'Nuevo tratamiento' : 'Agregar'}</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={s.list}
        numColumns={width >= 950 ? 2 : 1}
        columnWrapperStyle={width >= 950 ? s.columns : undefined}
        renderItem={({ item }) => (
          <View style={[s.card, !item.activo && s.cardInactive, width >= 950 && s.cardWide]}>
            <View style={s.cardTop}>
              <View style={s.toothIcon}><Text style={s.toothGlyph}>◇</Text></View>
              <View style={s.cardCopy}>
                <Text style={s.category}>{item.categoria}</Text>
                <Text style={s.name}>{item.nombre}</Text>
                {!!item.descripcion && <Text style={s.description}>{item.descripcion}</Text>}
                {!item.activo && <Text style={s.inactiveLabel}>INACTIVO</Text>}
              </View>
              <TouchableOpacity onPress={() => openForm(item)} style={s.editButton}><Text style={s.editLabel}>Editar</Text></TouchableOpacity>
            </View>
            <View style={s.cardBottom}>
              <Text style={s.duration}>◷  {item.duracion_min} min</Text>
              <Text style={s.price}>{currency(item.precio)}</Text>
            </View>
            <TouchableOpacity onPress={() => toggleActive(item)} style={s.deactivate}>
              <Text style={s.deactivateText}>{item.activo ? 'Desactivar del catálogo' : 'Reactivar en catálogo'}</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No hay prestaciones cargadas. Agregá la primera con el botón superior.</Text>}
      />
      <Modal visible={modal} transparent animationType="fade" onRequestClose={() => setModal(false)}>
        <View style={s.modalShade}>
          <ScrollView contentContainerStyle={s.modalScroll} keyboardShouldPersistTaps="handled">
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>{editing ? 'Editar prestación' : 'Nueva prestación'}</Text>
              <Text style={s.modalHint}>El precio queda disponible para el odontólogo al preparar un plan de atención.</Text>
              <Input label="Nombre *" value={form.nombre} onChangeText={(v) => setForm((p) => ({ ...p, nombre: v }))} placeholder="Ej. Limpieza dental" />
              <Input label="Categoría" value={form.categoria} onChangeText={(v) => setForm((p) => ({ ...p, categoria: v }))} placeholder="Prevención" />
              <Input label="Descripción" value={form.descripcion} onChangeText={(v) => setForm((p) => ({ ...p, descripcion: v }))} placeholder="Detalle breve" />
              <Input label="Precio (Gs.) *" value={form.precio} onChangeText={(v) => setForm((p) => ({ ...p, precio: v }))} keyboardType="decimal-pad" placeholder="0" />
              <Input label="Duración estimada (min)" value={form.duracionMin} onChangeText={(v) => setForm((p) => ({ ...p, duracionMin: v }))} keyboardType="number-pad" placeholder="30" />
              <View style={s.modalActions}>
                <Button title="Cancelar" variant="outline" onPress={() => setModal(false)} style={s.modalAction} />
                <Button title="Guardar" onPress={save} loading={saving} style={s.modalAction} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F7FB' }, centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  intro: { paddingHorizontal: 22, paddingTop: 20, paddingBottom: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  introCopy: { flex: 1 }, eyebrow: { color: '#8391A8', fontSize: 9, letterSpacing: 1.3, fontWeight: '800' },
  title: { color: '#233452', fontSize: 22, fontWeight: '800', marginTop: 5 }, subtitle: { color: '#7C8AA0', fontSize: 11, marginTop: 5 },
  addButton: { backgroundColor: '#2D60D6', borderRadius: 9, paddingHorizontal: 14, paddingVertical: 11 }, addLabel: { color: '#fff', fontSize: 11, fontWeight: '800' },
  list: { padding: 18, paddingTop: 6, paddingBottom: 35 }, columns: { gap: 12 },
  card: { backgroundColor: '#fff', borderColor: '#E8EDF4', borderWidth: 1, borderRadius: 13, padding: 16, marginBottom: 12, flex: 1 }, cardInactive: { backgroundColor: '#F8F9FB', opacity: 0.8 }, cardWide: { maxWidth: '50%' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 }, toothIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: '#EAF1FF', alignItems: 'center', justifyContent: 'center' }, toothGlyph: { fontSize: 21, color: '#2D60D6' },
  cardCopy: { flex: 1 }, category: { fontSize: 9, fontWeight: '800', color: '#8C9AB0', textTransform: 'uppercase', letterSpacing: 0.8 }, name: { color: '#2C3B57', fontSize: 14, fontWeight: '800', marginTop: 4 }, description: { color: '#8190A6', fontSize: 10, marginTop: 4, lineHeight: 15 }, inactiveLabel: { color: '#AB6470', fontSize: 8, fontWeight: '800', marginTop: 5 },
  editButton: { paddingHorizontal: 9, paddingVertical: 6, backgroundColor: '#F0F4FC', borderRadius: 7 }, editLabel: { color: '#3A68CC', fontSize: 9, fontWeight: '800' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEF1F5', marginTop: 14, paddingTop: 12 }, duration: { color: '#7F8DA2', fontSize: 10 }, price: { color: '#278662', fontSize: 15, fontWeight: '800' },
  deactivate: { alignSelf: 'flex-end', marginTop: 8, padding: 4 }, deactivateText: { color: '#A5AFBE', fontSize: 9 }, empty: { color: '#8794A9', fontSize: 12, textAlign: 'center', marginTop: 50 },
  modalShade: { flex: 1, backgroundColor: 'rgba(17,29,50,0.48)', justifyContent: 'center', padding: 18 }, modalScroll: { flexGrow: 1, justifyContent: 'center' }, modalCard: { width: '100%', maxWidth: 520, alignSelf: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 22 }, modalTitle: { color: '#273652', fontSize: 18, fontWeight: '800' }, modalHint: { color: '#8390A5', fontSize: 11, lineHeight: 16, marginTop: 7, marginBottom: 12 }, modalActions: { flexDirection: 'row', gap: 10, marginTop: 7 }, modalAction: { flex: 1 },
});
