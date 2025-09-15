import { useFrame, useThree } from '@react-three/fiber';
import React, { useRef } from 'react';

export const DynamicDPR: React.FC = () => {
  const { gl } = useThree();
  const fpsRef = useRef({ frames: 0, last: performance.now() });
  useFrame(() => {
    const now = performance.now();
    fpsRef.current.frames++;
    if (now - fpsRef.current.last > 1000) {
      const fps = fpsRef.current.frames;
      fpsRef.current.frames = 0;
      fpsRef.current.last = now;
      const target = fps < 50 ? 0.75 : fps > 58 ? 1.0 : gl.getPixelRatio();
      const next = Math.max(0.7, Math.min(1.0, target));
      if (Math.abs(next - gl.getPixelRatio()) > 0.05) gl.setPixelRatio(next);
    }
  });
  return null;
};