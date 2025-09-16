import { useEffect, useState } from 'react';

let last = performance.now();
let frames = 0;
let fpsValue = 60;
const listeners = new Set<(fps: number) => void>();

function tick() {
  const now = performance.now();
  frames++;
  if (now - last >= 1000) {
    fpsValue = Math.round((frames * 1000) / (now - last));
    frames = 0;
    last = now;
    listeners.forEach((cb) => cb(fpsValue));
  }
  requestAnimationFrame(tick);
}

// Start loop once
if (typeof window !== 'undefined') {
  requestAnimationFrame(tick);
}

export function subscribeFps(cb: (fps: number) => void) {
  listeners.add(cb);
  cb(fpsValue);
  return () => {
    // Ensure cleanup returns void
    listeners.delete(cb);
  };
}

export function useFps() {
  const [fps, setFps] = useState(fpsValue);
  useEffect(() => subscribeFps(setFps), []);
  return fps;
}