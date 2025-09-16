import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store/store';
import { getActiveAnalyser } from '../../audio/dsp/analyser';

/**
 * CentralScope
 * Dynamic cockpit overlay with rings, crosshair, rotating ticks,
 * scanner marker, and equalizer ring driven by analyser if available.
 * Now tinted with dynamic theme accent (album art palette).
 */
export const CentralScope: React.FC = () => {
  const scopeMode = useStore((s) => s.ui.scopeMode);
  const expanded = useStore((s) => s.ui.expanded);
  const lowPower = useStore((s) => s.ui.lowPower);
  const reducedMotion = useStore((s) => s.ui.reducedMotion);
  const accent = useStore((s) => s.theme.accent);

  const group = useRef<THREE.Group>(null!);
  const ringOuter = useRef<THREE.Mesh>(null!);
  const ringInner = useRef<THREE.Mesh>(null!);
  const crossH = useRef<THREE.Mesh>(null!);
  const crossV = useRef<THREE.Mesh>(null!);
  const ticks = useRef<THREE.InstancedMesh>(null!);
  const scanner = useRef<THREE.Mesh>(null!);
  const eqBars = useRef<THREE.Group>(null!);

  const {
    ringOuterGeom,
    ringInnerGeom,
    barGeom,
    hairGeom,
    tickGeom,
    scanGeom,
    reticleMat,
    hairMat,
    tickMat,
    scanMat,
    barMat
  } = useMemo(() => {
    const ringOuterGeom = new THREE.RingGeometry(0.62, 0.9, 128, 1);
    const ringInnerGeom = new THREE.RingGeometry(0.28, 0.3, 64, 1);

    const hairGeom = new THREE.PlaneGeometry(1.6, 0.005);
    const tickGeom = new THREE.PlaneGeometry(0.04, 0.08);
    const barGeom = new THREE.PlaneGeometry(0.035, 0.12);
    const scanGeom = new THREE.CircleGeometry(0.02, 16);

    const c = new THREE.Color('#58e7ff'); // initial; will be updated by accent effect
    const reticleMat = new THREE.MeshBasicMaterial({
      color: c.clone(),
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const hairMat = reticleMat.clone();
    hairMat.opacity = 0.35;
    const tickMat = reticleMat.clone();
    tickMat.opacity = 0.45;
    const barMat = reticleMat.clone();
    barMat.opacity = 0.5;
    const scanMat = new THREE.MeshBasicMaterial({
      color: c.clone().offsetHSL(0, 0, 0.1),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    return { ringOuterGeom, ringInnerGeom, barGeom, hairGeom, tickGeom, scanGeom, reticleMat, hairMat, tickMat, scanMat, barMat };
  }, []);

  // Live-apply album accent to all mats
  useEffect(() => {
    try {
      const col = new THREE.Color(accent || '#58e7ff');
      reticleMat.color.set(col);
      hairMat.color.set(col);
      tickMat.color.set(col);
      barMat.color.set(col);
      scanMat.color.set(col.clone().offsetHSL(0, 0, 0.1));
      reticleMat.needsUpdate = hairMat.needsUpdate = tickMat.needsUpdate = barMat.needsUpdate = scanMat.needsUpdate = true;
    } catch {
      // ignore bad color
    }
  }, [accent, reticleMat, hairMat, tickMat, barMat, scanMat]);

  const buildEqBars = useMemo(() => {
    const g = new THREE.Group();
    const count = 48;
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(barGeom, barMat.clone());
      const t = (i / count) * Math.PI * 2;
      const r = 0.5;
      m.position.set(Math.cos(t) * r, Math.sin(t) * r, 0.001);
      m.rotation.z = t;
      (m.material as THREE.MeshBasicMaterial).opacity = 0.25 + 0.35 * (i % 4 === 0 ? 1 : 0.4);
      g.add(m);
    }
    return g;
  }, [barGeom, barMat]);

  const setupTicks = () => {
    if (!ticks.current) return;
    const count = 60;
    const dummy = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const t = (i / count) * Math.PI * 2;
      const r = 0.96;
      dummy.position.set(Math.cos(t) * r, Math.sin(t) * r, 0.002);
      dummy.rotation.z = t;
      const s = i % 5 === 0 ? 1.6 : 1.0;
      dummy.scale.set(1, s, 1);
      dummy.updateMatrix();
      ticks.current.setMatrixAt(i, dummy.matrix);
      ticks.current.setColorAt?.(i, new THREE.Color().setHSL(0.48, 0.8, i % 5 === 0 ? 0.7 : 0.55));
    }
    ticks.current.instanceMatrix.needsUpdate = true;
  };

  React.useLayoutEffect(() => {
    if (!eqBars.current) return;
    while (eqBars.current.children.length > 0) {
      const child = eqBars.current.children[0];
      if (child) eqBars.current.remove(child);
    }
    eqBars.current.add(buildEqBars);
  }, [buildEqBars]);

  React.useLayoutEffect(() => {
    setupTicks();
  }, []);

  const freqRef = useRef<Uint8Array | null>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const motion = reducedMotion ? 0 : 1;
    const power = lowPower ? 0.4 : 1;

    if (group.current) {
      const base = scopeMode === 'ring' ? 0.25 : 0.12;
      group.current.rotation.z = motion * base * t;
      const scale = expanded ? 1.0 : 0.85;
      group.current.scale.setScalar(scale);
    }

    const pulse = 0.03 * Math.sin(t * 2.2) * power;
    if (ringOuter.current) ringOuter.current.scale.setScalar(1 + pulse);
    if (ringInner.current) ringInner.current.scale.setScalar(1 - pulse * 0.8);

    if (crossH.current && crossV.current) {
      const p = 1 + 0.04 * Math.sin(t * 1.6) * power;
      crossH.current.scale.set(p, 1, 1);
      crossV.current.scale.set(1, p, 1);
    }

    if (scanner.current) {
      const speed = scopeMode === 'ring' ? 1.6 : 1.0;
      const angle = t * speed * motion;
      const r = 0.77;
      scanner.current.position.set(Math.cos(angle) * r, Math.sin(angle) * r, 0.003);
      scanner.current.rotation.z = angle;
      const sm = scanner.current.material as THREE.MeshBasicMaterial;
      sm.opacity = 0.6 + 0.35 * (0.5 + 0.5 * Math.sin(t * 4.0));
    }

    if (eqBars.current) {
      const bars = eqBars.current.children;
      const baseR = 0.5;
      const analyser = getActiveAnalyser();
      let usedReal = false;

      if (analyser) {
        if (!freqRef.current || freqRef.current.length !== analyser.frequencyBinCount) {
          freqRef.current = new Uint8Array(analyser.frequencyBinCount);
        }
        // TS lib.dom variants: cast to any to avoid generic mismatch across TS libs
        (analyser as any).getByteFrequencyData(freqRef.current as any);

        for (let i = 0; i < bars.length; i++) {
          const m = bars[i] as THREE.Mesh | undefined;
          if (!m) continue;
          const bin = Math.floor((i / bars.length) * freqRef.current.length);
          const v = freqRef.current[bin] ?? 0;
          const norm = v / 255;
          const h = 0.06 + (scopeMode === 'equalizer' ? 0.28 : 0.18) * norm * power;
          const y = h * 0.5;
          m.scale.set(1, h / 0.12, 1);
          m.position.setLength(baseR + y);
        }
        usedReal = true;
      }

      if (!usedReal) {
        for (let i = 0; i < bars.length; i++) {
          const m = bars[i] as THREE.Mesh | undefined;
          if (!m) continue;
          const f =
            Math.abs(Math.sin(t * 2.0 + i * 0.3)) * 0.5 +
            Math.abs(Math.sin(t * 3.7 + i * 0.11)) * 0.35 +
            Math.abs(Math.sin(t * 5.3 + i * 0.07)) * 0.25;
          const h = 0.08 + (scopeMode === 'equalizer' ? 0.22 : 0.12) * f * power;
          const y = h * 0.5;
          m.scale.set(1, h / 0.12, 1);
          m.position.setLength(baseR + y);
        }
      }

      (eqBars.current as THREE.Group).visible = scopeMode === 'equalizer' || scopeMode === 'oscilloscope';
    }

    if (scopeMode === 'timeline' && ringOuter.current) {
      const sway = 0.06 * Math.sin(t * 1.2) * motion * power;
      ringOuter.current.position.x = sway;
      ringInner.current.position.x = -sway * 0.6;
    } else {
      if (ringOuter.current) ringOuter.current.position.x = 0;
      if (ringInner.current) ringInner.current.position.x = 0;
    }
  });

  return (
    <group ref={group}>
      <mesh ref={ringOuter} geometry={ringOuterGeom} material={reticleMat} position={[0, 0, 0.001]} />
      <mesh ref={ringInner} geometry={ringInnerGeom} material={reticleMat} position={[0, 0, 0.001]} />
      <mesh ref={crossH} geometry={hairGeom} material={hairMat} position={[0, 0, 0.001]} />
      <mesh ref={crossV} geometry={hairGeom} material={hairMat} rotation={[0, 0, Math.PI / 2]} position={[0, 0, 0.001]} />
      <instancedMesh ref={ticks} args={[tickGeom, tickMat, 60]} position={[0, 0, 0.002]} />
      <mesh ref={scanner} geometry={scanGeom} material={scanMat} position={[0.77, 0, 0.003]} />
      <group ref={eqBars} position={[0, 0, 0.001]} />
      <ambientLight intensity={0.15} />
      <pointLight position={[2, 2, 2]} intensity={0.35} />
    </group>
  );
};