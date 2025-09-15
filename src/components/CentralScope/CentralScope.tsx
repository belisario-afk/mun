import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/store';

// Visual scope modes: oscilloscope (default), equalizer, ring, timeline
export const CentralScope: React.FC = () => {
  const scopeMode = useStore((s) => s.ui.scopeMode);
  const expanded = useStore((s) => s.ui.expanded);
  const lowPower = useStore((s) => s.ui.lowPower);
  const reducedMotion = useStore((s) => s.ui.reducedMotion);
  const group = React.useRef<THREE.Group>(null!);
  const mesh = React.useRef<THREE.Mesh>(null!);

  const geom = useMemo(() => new THREE.RingGeometry(0.5, 0.9, 64, 1), []);
  const mat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x11ffee,
        roughness: 0.2,
        metalness: 0.8,
        clearcoat: 0.9,
        transparent: true,
        opacity: 0.8
      }),
    [],
  );

  useFrame((state, delta) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    const intensity = lowPower ? 0.2 : 1.0;
    group.current.rotation.z = reducedMotion ? 0 : t * 0.1 * intensity;

    if (mesh.current) {
      const s = expanded ? 1.0 : 0.8;
      mesh.current.scale.setScalar(s);
      const osc = Math.sin(t * 2.5) * 0.1;
      if (scopeMode === 'oscilloscope') {
        mesh.current.position.y = osc * intensity;
      } else if (scopeMode === 'equalizer') {
        mesh.current.scale.y = s + Math.abs(Math.sin(t * 5.0)) * 0.2 * intensity;
      } else if (scopeMode === 'ring') {
        mesh.current.rotation.z = t * 0.6 * intensity;
      } else if (scopeMode === 'timeline') {
        mesh.current.position.x = Math.sin(t * 1.2) * 0.2 * intensity;
      }
    }
  });

  return (
    <group ref={group}>
      <mesh ref={mesh} geometry={geom} material={mat} />
      <ambientLight intensity={0.2} />
      <pointLight position={[2, 2, 2]} intensity={0.8} />
    </group>
  );
};