import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/store';

export const Diagnostics: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [fps, setFps] = useState(0);
  const ai = useStore((s) => s.ai);
  const tablet = useStore((s) => s.tablet);

  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf: number;
    const loop = () => {
      frames++;
      const now = performance.now();
      if (now - last >= 1000) {
        setFps(frames);
        frames = 0;
        last = now;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={ref}
      className="absolute top-2 right-2 bg-black/50 text-xs p-2 rounded pointer-events-auto"
      aria-label="Diagnostics overlay"
      role="status"
    >
      <div>FPS: {fps}</div>
      <div>DPR: {window.devicePixelRatio.toFixed(2)}</div>
      <div>AI: {ai.enabled ? ai.provider : 'disabled'}</div>
      <div>Wake: {tablet.wakeLock ? 'on' : 'off'}</div>
      <div>FS: {tablet.fullscreen ? 'on' : 'off'}</div>
    </div>
  );
};