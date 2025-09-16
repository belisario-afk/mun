import React, { useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getActiveAnalyser } from '../../../audio/dsp/analyser';

type GridUniforms = {
  uTime: { value: number };
  uEnergy: { value: number };
  uBase: { value: THREE.Color };
  uAlpha: { value: number };
};

export const AudioGrid: React.FC = () => {
  const geo = useMemo(() => new THREE.PlaneGeometry(2, 2, 1, 1), []);
  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uEnergy: { value: 0 },
        uBase: { value: new THREE.Color('#58e7ff') },
        uAlpha: { value: 0.28 }
      } as GridUniforms,
      vertexShader: `
        varying vec2 vUv;
        void main(){
          vUv = uv;
          gl_Position = vec4(position.xy, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float uTime;
        uniform float uEnergy;
        uniform vec3 uBase;
        uniform float uAlpha;

        float n21(vec2 p){
          p = fract(p*vec2(234.34, 435.345));
          p += dot(p, p+34.45);
          return fract(p.x*p.y);
        }

        void main(){
          float speed = mix(0.03, 0.18, uEnergy);
          vec2 uv = vUv;
          uv.y += uTime*speed;
          uv.x += sin(uTime*0.5)*0.02*uEnergy;

          float gridX = smoothstep(0.96, 0.965, abs(fract(uv.x*18.0)-0.5)*2.0);
          float gridY = smoothstep(0.96, 0.965, abs(fract(uv.y*12.0)-0.5)*2.0);
          float grid = clamp(gridX + gridY, 0.0, 1.0);

          float flick = mix(0.7, 1.2, n21(vec2(floor(uv.x*24.0), floor(uTime*6.0))));
          float a = uAlpha * (0.55 + uEnergy*0.9) * flick * grid;

          gl_FragColor = vec4(uBase, a);
        }
      `
    });
    return m;
  }, []);

  useFrame((state) => {
    const a = getActiveAnalyser();
    let energy = 0.0;
    if (a) {
      const buf = new Uint8Array(a.frequencyBinCount);
      (a as any).getByteFrequencyData(buf);
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i]!;
      energy = Math.min(1, (sum / (buf.length || 1)) / 200);
    }
    const u = material.uniforms as GridUniforms;
    u.uTime.value = state.clock.elapsedTime;
    u.uEnergy.value = 0.9 * u.uEnergy.value + 0.1 * energy;
  });

  return <mesh geometry={geo} material={material} />;
};