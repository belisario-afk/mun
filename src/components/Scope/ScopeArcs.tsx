import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useStore } from '../../store/store';

type ArcProps = {
  radius: number;
  width: number; // tube radius
  color: string | number;
  speed?: number;
  phase?: number;
};

class ArcCurve3D extends THREE.Curve<THREE.Vector3> {
  private r: number;
  private start: number;
  private end: number;
  constructor(radius: number, startAngle: number, endAngle: number) {
    super();
    this.r = radius;
    this.start = startAngle;
    this.end = endAngle;
  }
  override getPoint(t: number, target = new THREE.Vector3()): THREE.Vector3 {
    const a = this.start + (this.end - this.start) * t;
    target.set(Math.cos(a) * this.r, Math.sin(a) * this.r, 0);
    return target;
  }
}

function Arc({ radius, width, color, speed = 0.4, phase = 0 }: ArcProps) {
  const ref = React.useRef<THREE.Mesh>(null);

  const geom = useMemo(() => {
    const start = Math.PI * 0.1;
    const end = Math.PI * 1.9;
    const curve = new ArcCurve3D(radius, start, end);
    // tubularSegments, radius (tube thickness), radialSegments, closed
    const g = new THREE.TubeGeometry(curve, 140, width, 8, false);
    g.rotateX(Math.PI / 2); // align with your scene orientation
    return g;
  }, [radius, width]);

  const mat = useMemo(
    () => new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 }),
    [color]
  );

  useFrame((s) => {
    if (!ref.current) return;
    const t = s.clock.elapsedTime;
    ref.current.rotation.z = t * speed + phase;
    if (mat.transparent) {
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, 0.5 + 0.25 * Math.sin(t * 2 + phase), 0.08);
    }
  });

  return <mesh ref={ref} geometry={geom} material={mat} position={[0, 0, -0.15]} />;
}

export const ScopeArcs: React.FC = () => {
  const reducedMotion = useStore((s) => s.ui.reducedMotion);
  const accent = useStore((s) => s.theme.accent) || '#58e7ff';
  if (reducedMotion) return null;

  return (
    <group>
      <Arc radius={0.42} width={0.004} color={accent} speed={0.35} phase={0} />
      <Arc radius={0.55} width={0.006} color={accent} speed={-0.28} phase={0.6} />
      <Arc radius={0.70} width={0.007} color={accent} speed={0.22} phase={1.3} />
    </group>
  );
};