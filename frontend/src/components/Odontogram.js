import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Colors from '../constants/colors';

// Numeración FDI (sistema internacional)
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];

// Deciduos (infantiles)
const UPPER_RIGHT_D = [55, 54, 53, 52, 51];
const UPPER_LEFT_D  = [61, 62, 63, 64, 65];
const LOWER_RIGHT_D = [85, 84, 83, 82, 81];
const LOWER_LEFT_D  = [71, 72, 73, 74, 75];

const ESTADO_CONFIG = {
  sano:        { color: Colors.white,        border: Colors.gray[300], label: '○' },
  evaluado:    { color: '#1e3a5f',            border: '#1e3a5f',        label: '●' },
  en_curso:    { color: Colors.warningLight,  border: Colors.warning,   label: '◑' },
  completado:  { color: Colors.successLight,  border: Colors.success,   label: '●' },
  extraccion:  { color: Colors.errorLight,    border: Colors.error,     label: '✕' },
  ausente:     { color: Colors.gray[100],     border: Colors.gray[400], label: '—' },
};

const ESTADOS_LIST = Object.keys(ESTADO_CONFIG);

function Tooth({ number, estado = 'sano', onPress, size = 'normal' }) {
  const config  = ESTADO_CONFIG[estado] || ESTADO_CONFIG.sano;
  const isSmall = size === 'small';

  return (
    <TouchableOpacity
      style={[
        styles.tooth,
        isSmall && styles.toothSmall,
        { backgroundColor: config.color, borderColor: config.border },
      ]}
      onPress={() => onPress && onPress(number)}
      accessibilityLabel={`Diente ${number}, estado: ${estado}`}
    >
      <Text style={[styles.toothLabel, isSmall && styles.toothLabelSmall]}>
        {config.label}
      </Text>
      <Text style={[styles.toothNumber, isSmall && styles.toothNumberSmall]}>
        {number}
      </Text>
    </TouchableOpacity>
  );
}

function ToothRow({ teeth, estados = {}, onPress, size }) {
  return (
    <View style={styles.row}>
      {teeth.map((n) => (
        <Tooth
          key={n}
          number={n}
          estado={estados[n] || 'sano'}
          onPress={onPress}
          size={size}
        />
      ))}
    </View>
  );
}

/**
 * Componente Odontograma
 * Props:
 *   estados: { [toothNumber]: estado } — estado actual de cada diente
 *   onToothPress: (toothNumber, currentEstado) => void — callback al tocar un diente
 *   showDeciduous: boolean — mostrar odontograma infantil
 *   readOnly: boolean — solo visualización
 */
export default function Odontogram({ estados = {}, onToothPress, showDeciduous = false, readOnly = false }) {
  function handlePress(number) {
    if (readOnly || !onToothPress) return;
    onToothPress(number, estados[number] || 'sano');
  }

  return (
    <View style={styles.container}>
      {/* Leyenda */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend}>
        {ESTADOS_LIST.map((e) => (
          <View key={e} style={styles.legendItem}>
            <View style={[styles.legendDot, {
              backgroundColor: ESTADO_CONFIG[e].color,
              borderColor: ESTADO_CONFIG[e].border,
            }]} />
            <Text style={styles.legendText}>{e.charAt(0).toUpperCase() + e.slice(1)}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Odontograma permanente */}
      <Text style={styles.arcadaLabel}>Permanente</Text>
      <View style={styles.arcada}>
        <Text style={styles.arcadaSide}>D</Text>
        <View style={styles.arcadaContent}>
          <View style={styles.jaw}>
            <ToothRow teeth={UPPER_RIGHT} estados={estados} onPress={handlePress} />
            <ToothRow teeth={UPPER_LEFT}  estados={estados} onPress={handlePress} />
          </View>
          <View style={styles.separator} />
          <View style={styles.jaw}>
            <ToothRow teeth={LOWER_RIGHT} estados={estados} onPress={handlePress} />
            <ToothRow teeth={LOWER_LEFT}  estados={estados} onPress={handlePress} />
          </View>
        </View>
        <Text style={styles.arcadaSide}>I</Text>
      </View>

      {/* Odontograma infantil */}
      {showDeciduous && (
        <>
          <Text style={styles.arcadaLabel}>Infantil (deciduos)</Text>
          <View style={styles.arcada}>
            <Text style={styles.arcadaSide}>D</Text>
            <View style={styles.arcadaContent}>
              <View style={styles.jaw}>
                <ToothRow teeth={UPPER_RIGHT_D} estados={estados} onPress={handlePress} size="small" />
                <ToothRow teeth={UPPER_LEFT_D}  estados={estados} onPress={handlePress} size="small" />
              </View>
              <View style={styles.separator} />
              <View style={styles.jaw}>
                <ToothRow teeth={LOWER_RIGHT_D} estados={estados} onPress={handlePress} size="small" />
                <ToothRow teeth={LOWER_LEFT_D}  estados={estados} onPress={handlePress} size="small" />
              </View>
            </View>
            <Text style={styles.arcadaSide}>I</Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.card, borderRadius: 12, padding: 12 },

  legend: { marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4, marginRight: 12 },
  legendDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 1.5 },
  legendText: { fontSize: 11, color: Colors.text.secondary },

  arcadaLabel: {
    fontSize: 12, fontWeight: '700', color: Colors.text.secondary,
    textAlign: 'center', marginBottom: 6,
  },
  arcada: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12,
  },
  arcadaSide: {
    fontSize: 11, fontWeight: '700', color: Colors.text.label, width: 14, textAlign: 'center',
  },
  arcadaContent: { flex: 1 },
  jaw:       { flexDirection: 'row', justifyContent: 'center', gap: 2, marginBottom: 2 },
  separator: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  row:   { flexDirection: 'row', gap: 2 },
  tooth: {
    width: 26, height: 30,
    borderRadius: 5, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
    gap: 0,
  },
  toothSmall: { width: 22, height: 26, borderRadius: 4 },
  toothLabel:       { fontSize: 10, fontWeight: '700', color: Colors.text.primary, lineHeight: 12 },
  toothLabelSmall:  { fontSize: 9 },
  toothNumber:      { fontSize: 7, color: Colors.text.secondary, lineHeight: 9 },
  toothNumberSmall: { fontSize: 6 },
});
