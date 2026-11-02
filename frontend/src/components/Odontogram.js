/**
 * Odontograma SVG con dientes de forma anatómica real.
 * Usa react-native-svg para dibujar cada diente con su forma correspondiente.
 * Numeración FDI internacional.
 */
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Modal, useWindowDimensions,
} from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import Colors from '../constants/colors';
import { useAppUi } from '../context/AppUiContext';

// ─── Configuración de estados ──────────────────────────────────────────────────
const ESTADO_CONFIG = {
  sano:       { fill: '#FFFFFF', stroke: '#CBD2E0', label: 'Sano' },
  evaluado:   { fill: '#BFDBFE', stroke: '#3B82F6', label: 'Evaluado' },
  en_curso:   { fill: '#FEF08A', stroke: '#EAB308', label: 'En curso' },
  completado: { fill: '#BBF7D0', stroke: '#22C55E', label: 'Completado' },
  extraccion: { fill: '#FECACA', stroke: '#EF4444', label: 'Extracción' },
  ausente:    { fill: '#F3F4F6', stroke: '#9CA3AF', label: 'Ausente' },
};

const ESTADO_CONFIG_DARK = {
  sano:       { fill: '#263244', stroke: '#CAD5E3', label: 'Sano' },
  evaluado:   { fill: '#1E3A68', stroke: '#8CB8FF', label: 'Evaluado' },
  en_curso:   { fill: '#59400F', stroke: '#F5C84C', label: 'En curso' },
  completado: { fill: '#174A3A', stroke: '#69D4A8', label: 'Completado' },
  extraccion: { fill: '#5B2630', stroke: '#F18A96', label: 'Extracción' },
  ausente:    { fill: '#222C3B', stroke: '#8795A9', label: 'Ausente' },
};

const ESTADOS_LIST = Object.keys(ESTADO_CONFIG);

// ─── Formas SVG por tipo de diente ────────────────────────────────────────────
// Cada función recibe (fill, stroke) y devuelve el path SVG del diente
// Coordenadas en un viewport de 28x40

function ToothIncisorCentral({ fill, stroke }) {
  // Incisivo central: forma trapezoidal ancha arriba, estrecha abajo
  return (
    <G>
      <Path
        d="M3,2 Q14,0 25,2 L23,32 Q14,36 5,32 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"
      />
      {/* Raíz */}
      <Path
        d="M10,32 Q14,38 18,32"
        fill="none" stroke={stroke} strokeWidth="1.2"
      />
    </G>
  );
}

function ToothIncisorLateral({ fill, stroke }) {
  return (
    <G>
      <Path
        d="M4,3 Q14,1 24,3 L22,30 Q14,35 6,30 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"
      />
      <Path
        d="M11,30 Q14,37 17,30"
        fill="none" stroke={stroke} strokeWidth="1.2"
      />
    </G>
  );
}

function ToothCanine({ fill, stroke }) {
  // Canino: punta más pronunciada
  return (
    <G>
      <Path
        d="M5,4 Q14,0 23,4 L22,28 Q14,38 6,28 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"
      />
      <Path
        d="M11,28 Q14,39 17,28"
        fill="none" stroke={stroke} strokeWidth="1.2"
      />
    </G>
  );
}

function ToothPremolar({ fill, stroke }) {
  // Premolar: dos cúspides
  return (
    <G>
      <Path
        d="M4,5 Q9,1 14,3 Q19,1 24,5 L23,28 Q14,33 5,28 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"
      />
      {/* Surco central */}
      <Path d="M14,3 L14,28" fill="none" stroke={stroke} strokeWidth="0.8" strokeDasharray="2,2" />
      {/* Raíces */}
      <Path d="M9,28 Q8,36 10,28" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M18,28 Q19,36 17,28" fill="none" stroke={stroke} strokeWidth="1" />
    </G>
  );
}

function ToothMolar({ fill, stroke }) {
  // Molar: ancho con 4 cúspides
  return (
    <G>
      <Path
        d="M3,5 Q8,1 13,3 Q18,1 25,5 L24,27 Q14,32 4,27 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"
      />
      {/* Surcos */}
      <Path d="M14,3 L14,27" fill="none" stroke={stroke} strokeWidth="0.8" strokeDasharray="2,2" />
      <Path d="M3,16 L25,16" fill="none" stroke={stroke} strokeWidth="0.8" strokeDasharray="2,2" />
      {/* 3 raíces */}
      <Path d="M7,27 Q5,36 8,27"  fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M14,27 Q14,37 14,27" fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M20,27 Q22,36 19,27" fill="none" stroke={stroke} strokeWidth="1" />
    </G>
  );
}

function ToothMolar3({ fill, stroke }) {
  // Tercer molar (muela del juicio): más pequeño
  return (
    <G>
      <Path
        d="M4,6 Q9,2 14,4 Q19,2 24,6 L23,26 Q14,30 5,26 Z"
        fill={fill} stroke={stroke} strokeWidth="1.5"
      />
      <Path d="M14,4 L14,26" fill="none" stroke={stroke} strokeWidth="0.8" strokeDasharray="2,2" />
      <Path d="M4,15 L24,15" fill="none" stroke={stroke} strokeWidth="0.8" strokeDasharray="2,2" />
      <Path d="M9,26 Q8,34 10,26"  fill="none" stroke={stroke} strokeWidth="1" />
      <Path d="M19,26 Q20,34 18,26" fill="none" stroke={stroke} strokeWidth="1" />
    </G>
  );
}

// ─── Mapa de tipo por número FDI ──────────────────────────────────────────────
function getToothType(num) {
  const pos = num % 10;
  if (pos === 1 || pos === 2) return 'incisor_central';
  if (pos === 2 && num <= 28)  return 'incisor_lateral';
  if (pos === 3)               return 'canine';
  if (pos === 4 || pos === 5)  return 'premolar';
  if (pos === 6 || pos === 7)  return 'molar';
  if (pos === 8)               return 'molar3';
  return 'incisor_central';
}

function ToothShape({ num, estado = 'sano', flipped = false, width = 28, configMap = ESTADO_CONFIG }) {
  const config = configMap[estado] || configMap.sano;
  const { fill, stroke } = config;
  const type = getToothType(num);

  const shape = {
    incisor_central: <ToothIncisorCentral fill={fill} stroke={stroke} />,
    incisor_lateral: <ToothIncisorLateral fill={fill} stroke={stroke} />,
    canine:          <ToothCanine         fill={fill} stroke={stroke} />,
    premolar:        <ToothPremolar       fill={fill} stroke={stroke} />,
    molar:           <ToothMolar          fill={fill} stroke={stroke} />,
    molar3:          <ToothMolar3         fill={fill} stroke={stroke} />,
  }[type] || <ToothIncisorCentral fill={fill} stroke={stroke} />;

  return (
    <Svg
      width={width}
      height={width * 1.5}
      viewBox="0 0 28 42"
      style={flipped ? { transform: [{ scaleY: -1 }] } : undefined}
    >
      {shape}
    </Svg>
  );
}

// ─── Componente de un diente completo (forma + número + estado) ───────────────
function Tooth({ number, estado = 'sano', onPress, isUpper, width = 28, configMap = ESTADO_CONFIG, numberColor }) {
  const config = configMap[estado] || configMap.sano;
  const isAbsent = estado === 'ausente';

  return (
    <TouchableOpacity
      onPress={() => onPress && onPress(number)}
      style={[styles.toothWrapper, { width }, isAbsent && styles.toothAbsent]}
      accessibilityLabel={`Diente ${number}: ${config.label}`}
    >
      {isUpper ? (
        <>
          <ToothShape num={number} estado={estado} flipped={false} width={width} configMap={configMap} />
          <Text style={[styles.toothNum, numberColor && { color: numberColor }, { fontSize: Math.max(6, Math.min(8, width * 0.29)) }]}>{number}</Text>
        </>
      ) : (
        <>
          <Text style={[styles.toothNum, numberColor && { color: numberColor }, { fontSize: Math.max(6, Math.min(8, width * 0.29)) }]}>{number}</Text>
          <ToothShape num={number} estado={estado} flipped={true} width={width} configMap={configMap} />
        </>
      )}
    </TouchableOpacity>
  );
}

// ─── Arcadas ──────────────────────────────────────────────────────────────────
const UPPER = [[18,17,16,15,14,13,12,11], [21,22,23,24,25,26,27,28]];
const LOWER = [[48,47,46,45,44,43,42,41], [31,32,33,34,35,36,37,38]];

/**
 * Odontogram — componente principal
 * Props:
 *   estados: { [num]: estado }
 *   onToothPress: (num, estadoActual) => void
 *   readOnly: boolean
 */
export default function Odontogram({ estados = {}, onToothPress, readOnly = false, manageStateExternally = false }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selected, setSelected]         = useState(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const { width: screenWidth } = useWindowDimensions();
  const { colors, mode } = useAppUi();
  const configMap = mode === 'dark' ? ESTADO_CONFIG_DARK : ESTADO_CONFIG;
  const availableWidth = Math.max(0, (containerWidth || screenWidth - 64) - 24);
  const toothWidth = Math.min(28, availableWidth / 16);

  function handlePress(num) {
    if (readOnly) return;
    if (manageStateExternally && onToothPress) {
      onToothPress(num, estados[num] || 'sano');
      return;
    }
    setSelected(num);
    setModalVisible(true);
  }

  function handleEstado(e) {
    if (onToothPress && selected !== null) {
      onToothPress(selected, e);
    }
    setModalVisible(false);
    setSelected(null);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]} onLayout={(event) => setContainerWidth(event.nativeEvent.layout.width)}>
      {/* Leyenda */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend}>
        {ESTADOS_LIST.map((e) => {
          const cfg = configMap[e];
          return (
            <View key={e} style={styles.legendItem}>
              <View style={[styles.legendSwatch, { backgroundColor: cfg.fill, borderColor: cfg.stroke }]} />
              <Text style={[styles.legendLabel, { color: colors.muted }]}>{cfg.label}</Text>
            </View>
          );
        })}
      </ScrollView>

      {/* Superior */}
      <Text style={[styles.arcLabel, { color: colors.muted }]}>Arcada superior</Text>
      <View style={[styles.arcRow, screenWidth < 640 ? styles.arcRowCompact : styles.arcRowWide]}>
        {[...UPPER[0], ...UPPER[1]].map((num) => (
          <Tooth
            key={num}
            number={num}
            estado={estados[num] || 'sano'}
            onPress={handlePress}
            isUpper={true}
            width={toothWidth}
            configMap={configMap}
            numberColor={colors.muted}
          />
        ))}
      </View>

      {/* Separador */}
      <View style={[styles.midline, { backgroundColor: colors.border }]} />

      {/* Inferior */}
      <View style={[styles.arcRow, screenWidth < 640 ? styles.arcRowCompact : styles.arcRowWide]}>
        {[...LOWER[0], ...LOWER[1]].map((num) => (
          <Tooth
            key={num}
            number={num}
            estado={estados[num] || 'sano'}
            onPress={handlePress}
            isUpper={false}
            width={toothWidth}
            configMap={configMap}
            numberColor={colors.muted}
          />
        ))}
      </View>
      <Text style={[styles.arcLabel, { color: colors.muted }]}>Arcada inferior</Text>

      {!readOnly && !manageStateExternally && (
        <Text style={[styles.hint, { color: colors.muted }]}>Tocá un diente para cambiar su estado</Text>
      )}

      {/* Modal selector de estado */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Diente {selected}</Text>
            <Text style={[styles.modalSub, { color: colors.muted }]}>
              Estado actual: {configMap[estados[selected] || 'sano']?.label}
            </Text>
            <View style={styles.estadoGrid}>
              {ESTADOS_LIST.map((e) => {
                const cfg = configMap[e];
                const isActive = (estados[selected] || 'sano') === e;
                return (
                  <TouchableOpacity
                    key={e}
                    style={[
                      styles.estadoBtn,
                      { backgroundColor: cfg.fill, borderColor: cfg.stroke },
                      isActive && [styles.estadoBtnActive, { borderColor: colors.primary, backgroundColor: colors.soft }],
                    ]}
                    onPress={() => handleEstado(e)}
                  >
                    <Text style={[styles.estadoBtnText, { color: isActive ? colors.primary : cfg.stroke }]}>{cfg.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.soft }]} onPress={() => setModalVisible(false)}>
              <Text style={[styles.cancelText, { color: colors.muted }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.cardBorder,
  },

  // Leyenda
  legend: { marginBottom: 10 },
  legendItem: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginRight: 14,
  },
  legendSwatch: {
    width: 14, height: 14,
    borderRadius: 4, borderWidth: 1.5,
  },
  legendLabel: { fontSize: 11, color: Colors.text.secondary },

  // Arcadas
  arcLabel: {
    fontSize: 10, fontWeight: '700',
    color: Colors.text.label, textAlign: 'center',
    letterSpacing: 0.8, marginVertical: 4,
  },
  arcRow: {
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'nowrap',
  },
  arcRowCompact: { justifyContent: 'space-between', gap: 0 },
  arcRowWide: { justifyContent: 'center', gap: 1 },
  midline: {
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: 6,
    borderRadius: 1,
  },

  // Diente
  toothWrapper: {
    alignItems: 'center',
    flexShrink: 0,
    paddingHorizontal: 0,
  },
  toothAbsent: { opacity: 0.3 },
  toothNum: {
    fontSize: 8,
    color: Colors.text.secondary,
    fontWeight: '600',
    lineHeight: 11,
  },

  hint: {
    fontSize: 11, color: Colors.text.label,
    textAlign: 'center', marginTop: 8,
    fontStyle: 'italic',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18, fontWeight: '700',
    color: Colors.text.primary, marginBottom: 4,
  },
  modalSub: {
    fontSize: 13, color: Colors.text.secondary, marginBottom: 16,
  },
  estadoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  estadoBtn: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 10, borderWidth: 1.5,
    minWidth: '30%',
    alignItems: 'center',
  },
  estadoBtnActive: {
    borderWidth: 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  estadoBtnText: { fontSize: 12, fontWeight: '600' },
  cancelBtn: {
    alignItems: 'center', padding: 10,
    borderRadius: 8,
    backgroundColor: Colors.gray[100],
  },
  cancelText: { fontSize: 14, color: Colors.text.secondary, fontWeight: '500' },
});
