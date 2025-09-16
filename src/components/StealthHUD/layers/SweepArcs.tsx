import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getActiveAnalyser } from '../../../audio/dsp/analyser';

export const SweepArcs: React.FC = () => {
  const group = useRef<THREE.Group>(null!);
  const arcs = useMemo(() => {
    const g = new THREE.Group();
    const base = new THREE.RingGeometry(0.65, 0.7, 128, 1, 0, Math.PI * 0.35);
    for (let i = 0; i < 5; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color('#58e7ff'),
        transparent: true,
        opacity: 0.22 + i * 0.06,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      const m = new THREE.Mesh(base, mat);
      m.rotation.z = (i / 5) * Math.PI * 2;
      m.position.z = 0.001 + i * 0.0002;
      g.add(m);
    }
    return g;
  }, []);

  const energyRef = useRef(0);

  useFrame((state) => {
    if (!group.current) return;
    if (group.current.children.length === 0) {
      group.current.add(arcs);
    }
    const t = state.clock.elapsedTime;

    const a = getActiveAnalyser();
    let energy = 0;
    if (a) {
      const buf = new Uint8Array(a.frequencyBinCount);
      (a as any).getByteFrequencyData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i]!;
      energy = Math.min(1, (sum / (buf.length || 1)) / 200);
    }
    energyRef.current = 0.9 * energyRef.current + 0.1 * energy;

    const speed = 0.5 + energyRef.current * 2.2;
    group.current.rotation.z = t * speed;

    // Subtle pulsation in opacity with guards
    group.current.children.forEach((child, idx) => {
      if ((child as any).isMesh) {
        const mesh = child as THREE.Mesh;
        const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        mats.forEach((m) => {
          if (m && (m as any).opacity !== undefined) {
            const mb = m as THREE.MeshBasicMaterial;
            mb.opacity = 0.2 + 0.35 * (0.5 + 0.5 * Math.sin(t * 3.0 + idx * 0.7)) * (0.5 + 0.5 * energyRef.current);
          }
        });
      }
    });
  });

  return <group ref={group} />;
};