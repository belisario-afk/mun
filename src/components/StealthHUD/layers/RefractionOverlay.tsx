import React, { useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

type RefractUniforms = {
  uTime: { value: number };
  uIntensity: { value: number };
  uChroma: { value: number };
};

export const RefractionOverlay: React.FC = () => {
  const geo = useMemo(() => new THREE.PlaneGeometry(2, 2, 1, 1), []);
  const mat = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uTime: { value: 0 },
        uIntensity: { value: 0.15 },
        uChroma: { value: 0.6 }
      } as RefractUniforms,
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
        uniform float uIntensity;
        uniform float uChroma;

        float noise(vec2 p){
          return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453);
        }

        vec3 neon(vec2 uv, float t){
          float r = 0.5 + 0.5*sin(uv.x*20.0 + t*1.7);
          float g = 0.5 + 0.5*sin(uv.y*22.0 + t*1.9 + 1.0);
          float b = 0.5 + 0.5*sin((uv.x+uv.y)*18.0 + t*2.3 + 2.0);
          return vec3(r,g,b);
        }

        void main(){
          vec2 uv = vUv;
          vec2 warp = vec2(
            sin(uv.y*18.0 + uTime*1.4),
            cos(uv.x*16.0 + uTime*1.3)
          ) * 0.0025;

          uv += warp * uIntensity;

          vec3 tint = neon(uv + 0.02*vec2(cos(uTime*0.5), sin(uTime*0.4)), uTime);
          tint = mix(vec3(0.3,0.8,1.0), tint, uChroma);

          float vign = smoothstep(1.2, 0.4, length(uv-0.5));
          float alpha = 0.08 * uIntensity * vign;

          gl_FragColor = vec4(tint, alpha);
        }
      `
    });
    return m;
  }, []);

  useFrame((st) => {
    const u = mat.uniforms as RefractUniforms;
    u.uTime.value = st.clock.elapsedTime;
  });

  return <mesh geometry={geo} material={mat} />;
};