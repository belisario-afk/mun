import { useEffect, useRef, useState } from 'react';

export type EnergyBands = { bass: number; mid: number; high: number; avg: number; beat: boolean };

type U8 = Uint8Array<ArrayBuffer>;

export function useAnalyserFromMic(enabled: boolean): EnergyBands {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataRef = useRef<U8 | null>(null);
  const [bands, setBands] = useState<EnergyBands>({ bass: 0, mid: 0, high: 0, avg: 0, beat: false });

  useEffect(() => {
    let ac: AudioContext | null = null;
    let src: MediaStreamAudioSourceNode | null = null;
    let raf = 0;
    let alive = true;

    async function start() {
      if (!enabled) return;
      try {
        ac = new (window.AudioContext || (window as any).webkitAudioContext)();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        src = ac.createMediaStreamSource(stream);
        const analyser = ac.createAnalyser();
        analyser.fftSize = 2048;
        analyser.smoothingTimeConstant = 0.8;
        src.connect(analyser);
        analyserRef.current = analyser;

        // Back with a concrete ArrayBuffer so the generic is ArrayBuffer (not ArrayBufferLike)
        const backing = new ArrayBuffer(analyser.frequencyBinCount);
        const arr = new Uint8Array(backing) as U8;
        dataRef.current = arr;

        const history: number[] = [];
        const maxHistory = 32;

        const loop = () => {
          if (!alive || !analyserRef.current || !dataRef.current) return;

          // This now matches getByteFrequencyData(array: Uint8Array<ArrayBuffer>)
          analyserRef.current.getByteFrequencyData(dataRef.current);

          const d = dataRef.current;
          const len = d.length;
          const third = Math.floor(len / 3);
          let bass = 0, mid = 0, high = 0;
          for (let i = 0; i < third; i++) bass += d[i]!;
          for (let i = third; i < 2 * third; i++) mid += d[i]!;
          for (let i = 2 * third; i < len; i++) high += d[i]!;
          bass /= third; mid /= third; high /= len - 2 * third;
          const avg = (bass + mid + high) / 3;

          history.push(avg);
          if (history.length > maxHistory) history.shift();
          const movingAvg = history.reduce((a, b) => a + b, 0) / history.length;
          const beat = avg > movingAvg * 1.25 && avg > 24;

          setBands({ bass, mid, high, avg, beat });
          raf = requestAnimationFrame(loop);
        };
        raf = requestAnimationFrame(loop);
      } catch {
        // Permission denied or not available -> keep fallback zeros
      }
    }
    void start();

    return () => {
      alive = false;
      if (raf) cancelAnimationFrame(raf);
      try { ac?.close(); } catch { /* noop */ }
    };
  }, [enabled]);

  return bands;
}