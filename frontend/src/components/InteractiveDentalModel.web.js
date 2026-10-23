import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Canvas } from '@react-three/fiber';
import { DentalScene } from './DentalModelScene';

export default function InteractiveDentalModel({ estados, onToothPress, showDeciduous }) {
  const [rotation, setRotation] = useState([-0.72, 0, 0]);
  const [drag, setDrag] = useState(null);
  const begin = (event) => setDrag([event.clientX, event.clientY]);
  const move = (event) => {
    if (!drag) return;
    const dx = event.clientX - drag[0];
    const dy = event.clientY - drag[1];
    setRotation(([x, y]) => [Math.max(-1.45, Math.min(1.45, x + dy * 0.008)), y + dx * 0.008, 0]);
    setDrag([event.clientX, event.clientY]);
  };
  return (
    <View style={styles.wrap} onPointerDown={begin} onPointerMove={move} onPointerUp={() => setDrag(null)} onPointerCancel={() => setDrag(null)}>
      <Canvas camera={{ position: [0, 2.2, 6.8], fov: 34 }} gl={{ antialias: true }}>
        <group scale={[1.25, 1.25, 1.25]}>
          <DentalScene estados={estados} onToothPress={onToothPress} rotation={rotation} showDeciduous={showDeciduous} />
        </group>
      </Canvas>
      <View pointerEvents="none" style={styles.hint}><Text style={styles.hintText}>Arrastrá para girar · Tocá un diente para editar</Text></View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', height: 390, backgroundColor: '#F2F6FB', borderRadius: 12, overflow: 'hidden', touchAction: 'none', cursor: 'grab' },
  hint: { position: 'absolute', bottom: 8, alignSelf: 'center', backgroundColor: 'rgba(255,255,255,.86)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  hintText: { color: '#63728A', fontSize: 10, fontWeight: '600' },
});
