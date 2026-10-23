/* eslint react/no-unknown-property: "off" */
import React, { useMemo } from 'react';
import { CatmullRomCurve3, Shape, ExtrudeGeometry, Vector3 } from 'three';

const STATE_COLORS = {
  sano: '#F6EBD5', evaluado: '#4F78A5', en_curso: '#E4AD38',
  completado: '#24A77C', extraccion: '#D95D68', ausente: '#B9C2CE',
};
const ROWS = {
  upper: [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28],
  lower: [48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38],
  upperD: [55,54,53,52,51,61,62,63,64,65],
  lowerD: [85,84,83,82,81,71,72,73,74,75],
};

function getToothShape(number) {
  const n = number % 10;
  if (n === 1 || n === 2) return 'incisor';
  if (n === 3) return 'canine';
  if (n === 4 || n === 5) return 'premolar';
  return 'molar';
}

function toothColor(state) {
  return STATE_COLORS[state] || STATE_COLORS.sano;
}

function createCrownGeometry(type, width, depth, lower) {
  const shape = new Shape();
  const w = width;
  const d = depth;
  if (type === 'incisor') {
    shape.moveTo(-w * 0.82, -d * 0.46);
    shape.bezierCurveTo(-w * 1.08, -d * 0.2, -w * 0.98, d * 0.36, -w * 0.7, d * 0.48);
    shape.bezierCurveTo(-w * 0.25, d * 0.67, w * 0.25, d * 0.67, w * 0.7, d * 0.48);
    shape.bezierCurveTo(w * 0.98, d * 0.36, w * 1.08, -d * 0.2, w * 0.82, -d * 0.46);
    shape.quadraticCurveTo(0, -d * 0.62, -w * 0.82, -d * 0.46);
  } else if (type === 'canine') {
    shape.moveTo(-w * 0.65, -d * 0.42);
    shape.bezierCurveTo(-w * 1.1, -d * 0.08, -w * 0.82, d * 0.54, -w * 0.34, d * 0.53);
    shape.quadraticCurveTo(0, d * 0.62, w * 0.34, d * 0.53);
    shape.bezierCurveTo(w * 0.82, d * 0.54, w * 1.1, -d * 0.08, w * 0.65, -d * 0.42);
    shape.quadraticCurveTo(0, -d * 0.62, -w * 0.65, -d * 0.42);
  } else if (type === 'premolar') {
    shape.moveTo(-w * 0.7, -d * 0.45);
    shape.bezierCurveTo(-w * 1.08, -d * 0.05, -w * 0.92, d * 0.4, -w * 0.52, d * 0.52);
    shape.quadraticCurveTo(0, d * 0.68, w * 0.52, d * 0.52);
    shape.bezierCurveTo(w * 0.92, d * 0.4, w * 1.08, -d * 0.05, w * 0.7, -d * 0.45);
    shape.quadraticCurveTo(0, -d * 0.62, -w * 0.7, -d * 0.45);
  } else {
    shape.moveTo(-w * 0.66, -d * 0.54);
    shape.bezierCurveTo(-w * 0.98, -d * 0.48, -w * 1.02, -d * 0.12, -w * 0.86, d * 0.03);
    shape.bezierCurveTo(-w * 1.02, d * 0.4, -w * 0.68, d * 0.58, -w * 0.38, d * 0.48);
    shape.bezierCurveTo(-w * 0.08, d * 0.7, w * 0.16, d * 0.66, w * 0.38, d * 0.48);
    shape.bezierCurveTo(w * 0.72, d * 0.62, w * 1.0, d * 0.35, w * 0.86, d * 0.03);
    shape.bezierCurveTo(w * 1.02, -d * 0.24, w * 0.78, -d * 0.56, w * 0.5, -d * 0.49);
    shape.bezierCurveTo(w * 0.18, -d * 0.68, -w * 0.1, -d * 0.68, -w * 0.36, -d * 0.49);
    shape.quadraticCurveTo(-w * 0.53, -d * 0.58, -w * 0.66, -d * 0.54);
  }
  const geometry = new ExtrudeGeometry(shape, {
    depth: depth * 1.12,
    bevelEnabled: true,
    bevelSegments: 5,
    steps: 1,
    bevelSize: Math.min(width, depth) * 0.13,
    bevelThickness: Math.min(width, depth) * 0.1,
    curveSegments: 16,
  });
  geometry.rotateX(lower ? Math.PI / 2 : -Math.PI / 2);
  geometry.computeVertexNormals();
  return geometry;
}

function Tooth({ number, state, lower, x, z, angle, small, onToothPress }) {
  const type = getToothShape(number);
  const stateColor = toothColor(state);
  const size = small ? 0.68 : 1;
  const [w, h, d] = {
    incisor: [0.185, 0.29, 0.16],
    canine: [0.19, 0.34, 0.17],
    premolar: [0.215, 0.29, 0.205],
    molar: [0.25, 0.28, 0.24],
  }[type].map((v) => v * size);
  const crownGeometry = useMemo(() => createCrownGeometry(type, w, d, lower), [type, w, d, lower]);
  if (state === 'ausente') {
    return (
      <mesh position={[x, 0, z]} rotation={[0, angle, 0]} onClick={(event) => { event.stopPropagation(); onToothPress(number); }}>
        <sphereGeometry args={[small ? 0.13 : 0.2, 10, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
    );
  }
  const rootCount = type === 'molar' ? 3 : type === 'premolar' ? 2 : 1;
  // Upper roots point toward the maxilla; lower roots point toward the mandible.
  const rootDirection = lower ? -1 : 1;
  const rotation = [0, angle, 0];

  return (
    <group
      position={[x, 0, z]}
      rotation={rotation}
      onClick={(event) => { event.stopPropagation(); onToothPress(number); }}
    >
      {/* Tapered, individually separated roots */}
      {Array.from({ length: rootCount }, (_, index) => {
        const side = index - (rootCount - 1) / 2;
        const lateral = side * w * 0.62;
        const rear = rootCount === 3 && index === 1 ? -d * 0.35 : d * 0.13;
        return (
          <group key={`root-${index}`} position={[lateral, rootDirection * h * 0.69, rear]} rotation={[lower ? Math.PI : 0, 0, -side * 0.12]}>
            <mesh castShadow receiveShadow>
              <coneGeometry args={[w * 0.34, h * (type === 'molar' ? 1.05 : 1.24), 20, 5]} />
              <meshPhysicalMaterial color={state === 'sano' ? '#E7D8BF' : stateColor} roughness={0.36} clearcoat={0.18} />
            </mesh>
            {/* subtle root ridge */}
            <mesh position={[w * 0.06, rootDirection * h * 0.08, d * 0.04]} scale={[w * 0.14, h * 0.34, d * 0.1]}>
              <sphereGeometry args={[1, 14, 12]} />
              <meshStandardMaterial color={state === 'sano' ? '#F4E9D5' : stateColor} roughness={0.38} />
            </mesh>
          </group>
        );
      })}

      {/* Crown silhouette is custom per tooth family, with smooth enamel bevels. */}
      <mesh geometry={crownGeometry} position={[0, -rootDirection * h * 0.035, 0]} castShadow receiveShadow>
        <meshPhysicalMaterial color={stateColor} roughness={0.2} metalness={0.005} clearcoat={0.68} clearcoatRoughness={0.14} />
      </mesh>

      {/* Flattened crown lobes give incisors, canines and molars distinct profiles. */}
      {type === 'molar' && [[-1,-1],[-1,1],[1,-1],[1,1]].map(([sx, sz], i) => (
        <mesh key={`cusp-${i}`} position={[sx * w * 0.34, -rootDirection * d * 0.74, sz * d * 0.34]} scale={[w * 0.34, h * 0.22, d * 0.32]} castShadow>
          <sphereGeometry args={[1, 22, 18]} />
          <meshPhysicalMaterial color={stateColor} roughness={0.24} clearcoat={0.45} />
        </mesh>
      ))}
      {type === 'premolar' && [-1, 1].map((side) => (
        <mesh key={`cusp-${side}`} position={[side * w * 0.34, -rootDirection * d * 0.72, -d * 0.06]} scale={[w * 0.31, h * 0.23, d * 0.36]} castShadow>
          <sphereGeometry args={[1, 22, 18]} />
          <meshPhysicalMaterial color={stateColor} roughness={0.22} clearcoat={0.48} />
        </mesh>
      ))}
      {type === 'canine' && (
        <mesh position={[0, -rootDirection * h * 0.44, 0]} rotation={[lower ? 0 : Math.PI, 0, 0]}>
          <coneGeometry args={[w * 0.5, h * 0.42, 24, 6]} />
          <meshPhysicalMaterial color={stateColor} roughness={0.23} clearcoat={0.45} />
        </mesh>
      )}
      {type === 'molar' && (
        <mesh position={[0, -rootDirection * h * 0.25, 0]} rotation={[0, angle, 0]}>
          <torusGeometry args={[w * 0.45, 0.009 * size, 8, 36]} />
          <meshStandardMaterial color={state === 'sano' ? '#D8CBB2' : stateColor} roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Arch({ teeth, estados, onToothPress, lower, y, small = false }) {
  const curve = useMemo(() => {
    const count = 64;
    const points = Array.from({ length: count + 1 }, (_, i) => {
      const angle = -1.25 + (2.5 * i) / count;
      return new Vector3(2.15 * Math.sin(angle), 0, 1.08 * Math.cos(angle) - 0.08);
    });
    return new CatmullRomCurve3(points);
  }, []);
  const gumRadius = small ? 0.105 : 0.16;
  const toothSize = small ? 0.66 : 1;
  const startAngle = -1.18;
  const endAngle = 1.18;

  return (
    <group position={[0, y, 0]}>
      {/* Soft pink alveolar ridge follows the natural horseshoe curve */}
      <mesh castShadow receiveShadow>
        <tubeGeometry args={[curve, 72, gumRadius, 18, false]} />
        <meshPhysicalMaterial color="#C9787E" roughness={0.38} clearcoat={0.28} clearcoatRoughness={0.32} />
      </mesh>
      <mesh position={[0, lower ? -0.44 : 0.44, -0.18]}>
        <tubeGeometry args={[curve, 72, small ? 0.25 : 0.38, 20, false]} />
        <meshPhysicalMaterial color="#8394A7" roughness={0.54} transparent opacity={0.18} depthWrite={false} />
      </mesh>
      <mesh position={[0, lower ? -0.035 : 0.035, -0.19]} scale={[1.6, 0.075, 0.54]}>
        <sphereGeometry args={[1, 32, 20]} />
        <meshPhysicalMaterial color="#D99093" roughness={0.45} clearcoat={0.15} />
      </mesh>
      {teeth.map((number, index) => {
        const angle = startAngle + (endAngle - startAngle) * (index / (teeth.length - 1));
        const x = 2.15 * Math.sin(angle);
        const z = 1.08 * Math.cos(angle) - 0.08;
        return (
          <group key={number} position={[x, 0, z]} scale={toothSize}>
            <Tooth
              number={number}
              state={estados[number] || 'sano'}
              lower={lower}
              x={0}
              z={0}
              angle={-angle * 0.74}
              small={small}
              onToothPress={onToothPress}
            />
          </group>
        );
      })}
    </group>
  );
}

export function DentalScene({ estados, onToothPress, rotation, showDeciduous }) {
  return (
    <>
      <color attach="background" args={['#EEF3F8']} />
      <ambientLight intensity={0.76} />
      <hemisphereLight args={['#FFFFFF', '#AAB4C3', 1.0]} />
      <directionalLight position={[3.5, 6, 5]} intensity={2.7} castShadow />
      <directionalLight position={[-4, 2, -2]} intensity={1.5} color="#DCE9FC" />
      <pointLight position={[0, 1, 4]} intensity={0.8} color="#FFF4E8" />
      <group rotation={rotation}>
        <Arch teeth={ROWS.upper} estados={estados} onToothPress={onToothPress} y={0.46} lower={false} />
        <Arch teeth={ROWS.lower} estados={estados} onToothPress={onToothPress} y={-0.58} lower />
        {showDeciduous && (
          <group position={[0, 0, -1.25]} scale={0.68}>
            <Arch teeth={ROWS.upperD} estados={estados} onToothPress={onToothPress} y={0.54} lower={false} small />
            <Arch teeth={ROWS.lowerD} estados={estados} onToothPress={onToothPress} y={-0.5} lower small />
          </group>
        )}
      </group>
    </>
  );
}
