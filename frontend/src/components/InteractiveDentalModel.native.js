import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, PanResponder } from 'react-native';
import { Canvas } from '@react-three/fiber/native';
import { DentalScene } from './DentalModelScene';

export default function InteractiveDentalModel({ estados, onToothPress, showDeciduous }) {
  const [rotation, setRotation] = useState([-0.72, 0, 0]);
  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_event, gesture) => Math.abs(gesture.dx) + Math.abs(gesture.dy) > 8,
    onPanResponderMove: (_event, gesture) => {
      setRotation(([x, y]) => [Math.max(-1.45, Math.min(1.45, x + gesture.dy * 0.008)), y + gesture.dx * 0.008, 0]);
    },
    onPanResponderTerminationRequest: () => false,
  }), []);
  return (
    <View style={styles.wrap} {...panResponder.panHandlers}>
      <Canvas camera={{ position: [0, 2.2, 6.8], fov: 34 }}>
        <group scale={[1.25, 1.25, 1.25]}>
          <DentalScene estados={estados} onToothPress={onToothPress} rotation={rotation} showDeciduous={showDeciduous} />
        </group>
      </Canvas>
      <View pointerEvents="none" style={styles.hint}><Text style={styles.hintText}>Deslizá para girar · Tocá un diente para editar</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: 390, backgroundColor: '#F2F6FB', borderRadius: 12, overflow: 'hidden' },
  hint: { position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,.86)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  hintText: { color: '#63728A', fontSize: 10, fontWeight: '600' },
});
