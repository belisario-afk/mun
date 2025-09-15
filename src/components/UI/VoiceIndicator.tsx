import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/store';
import { isSpeechRecognitionAvailable, startListening, stopListening } from '../../voice/SpeechRecognition';

export const VoiceIndicator: React.FC = () => {
  const { listening } = useStore((s) => s.voice);
  const ai = useStore((s) => s.ai);
  const [supported, setSupported] = useState(false);
  const meterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSupported(isSpeechRecognitionAvailable());
  }, []);

  // Simple CSS VU meter (pulse when listening)
  useEffect(() => {
    let raf: number;
    const el = meterRef.current;
    if (!el) return;
    const loop = () => {
      if (listening) {
        const t = performance.now() * 0.005;
        const v = 0.5 + Math.abs(Math.sin(t)) * 0.5;
        el.style.transform = `scaleX(${0.3 + v * 0.7})`;
      } else {
        el.style.transform = 'scaleX(0.2)';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [listening]);

  const toggle = () => {
    if (!ai.enabled) return;
    if (listening) stopListening();
    else startListening();
  };

  return (
    <div
      className="absolute top-2 left-2 p-2 rounded bg-slate-800/80 pointer-events-auto min-w-[220px]"
      aria-live="polite"
      aria-label={listening ? 'AI Listening' : 'AI idle'}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          {listening ? 'AI Listening…' : ai.enabled ? 'AI idle' : 'AI disabled'}
        </div>
        <button
          className="px-2 py-1 bg-black/40 rounded text-xs disabled:opacity-50"
          aria-label={listening ? 'Stop microphone' : 'Start microphone'}
          onClick={toggle}
          disabled={!supported || !ai.enabled}
          title={!supported ? 'Speech recognition unavailable' : 'Toggle mic'}
        >
          {listening ? 'Stop Mic' : 'Start Mic'}
        </button>
      </div>
      <div className="mt-2 h-1 bg-black/40 rounded overflow-hidden">
        <div ref={meterRef} className="h-full bg-green-500 origin-left" style={{ transform: 'scaleX(0.2)' }} />
      </div>
      {!supported && (
        <div className="mt-1 text-[11px] opacity-70">Mic unavailable. Use the command bar in Menu.</div>
      )}
    </div>
  );
};