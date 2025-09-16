import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../store/store';

export const WeatherLayerFX: React.FC = () => {
  const w = useStore((s) => s.sensors.weather);
  const lowPower = useStore((s) => s.ui.lowPower);
  const reducedMotion = useStore((s) => s.ui.reducedMotion);
  const group = useRef<THREE.Group>(null);

  if (!w || reducedMotion) return null;

  const count = lowPower ? 100 : 300;
  const isRain = w.kind === 'rain';
  const isSnow = w.kind === 'snow';

  if (!isRain && !isSnow) return null;

  const geom = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 4; // x
      positions[i * 3 + 1] = Math.random() * 3; // y
      positions[i * 3 + 2] = -0.4 - Math.random() * 0.2; // z
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return g;
  }, [count]);

  const mat = useMemo(() => {
    const color = isSnow ? new THREE.Color('#ffffff') : new THREE.Color('#7fbfff');
    return new THREE.PointsMaterial({
      color,
      size: isSnow ? 0.02 : 0.01,
      transparent: true,
      opacity: isSnow ? 0.9 : 0.5,
      depthWrite: false
    });
  }, [isSnow]);

  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.children.forEach((child) => {
      const pts = child as THREE.Points;
      const a = pts.geometry.getAttribute('position') as THREE.BufferAttribute;
      for (let i = 0; i < a.count; i++) {
        const y = a.getY(i) - delta * (isSnow ? 0.3 : 2.8);
        a.setY(i, y < -0.2 ? 3.0 : y);
        if (isSnow) {
          const x = a.getX(i) + (Math.sin((y + i) * 0.5) * 0.1) * delta;
          a.setX(i, Math.abs(x) > 2 ? -x : x);
        }
      }
      a.needsUpdate = true;
    });
  });

  return (
    <group ref={group}>
      <points geometry={geom} material={mat} />
    </group>
  );
};