import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../store/store';

export const ScopeParticles: React.FC = () => {
  const lowPower = useStore((s) => s.ui.lowPower);
  const reducedMotion = useStore((s) => s.ui.reducedMotion);
  const playing = useStore((s) => s.player.playing);
  const themeAccent = useStore((s) => s.theme.accent) || '#58e7ff';
  const count = lowPower ? 120 : 320;

  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 0.4 + Math.random() * 0.5;
      const a = Math.random() * Math.PI * 2;
      arr[i * 3 + 0] = Math.cos(a) * r;
      arr[i * 3 + 1] = Math.sin(a) * r;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 0.1;
    }
    return arr;
  }, [count]);

  const color = useMemo(() => new THREE.Color(themeAccent), [themeAccent]);
  const material = useMemo(
    () => new THREE.PointsMaterial({ size: 0.01, color, transparent: true, opacity: 0.8, depthWrite: false }),
    [color]
  );

  useFrame((state, delta) => {
    if (!points.current || reducedMotion) return;
    const t = state.clock.elapsedTime;
    const s = playing ? 1.0 : 0.5;
    points.current.rotation.z = t * 0.06 * s;
    material.opacity = THREE.MathUtils.lerp(material.opacity, playing ? 0.9 : 0.4, 0.05);
  });

  if (reducedMotion) return null;

  return (
    <points ref={points} position={[0, 0, -0.2]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
      </bufferGeometry>
      <primitive object={material} attach="material" />
    </points>
  );
};