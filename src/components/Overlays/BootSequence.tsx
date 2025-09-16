import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/store';

const SECS = 2.4;

export const BootSequence: React.FC = () => {
  const ui = useStore((s) => s.ui);
  const [show, setShow] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    const done = sessionStorage.getItem('boot_seq_done') === '1';
    if (ui.reducedMotion || !ui.bootSequence || done) return;
    setShow(true);
    timer.current = window.setTimeout(() => {
      setShow(false);
      sessionStorage.setItem('boot_seq_done', '1');
    }, SECS * 1000);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [ui.bootSequence, ui.reducedMotion]);

  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 pointer-events-auto bg-black flex items-center justify-center overflow-hidden">
      {/* Scanline / noise */}
      <div className="absolute inset-0 opacity-[0.12] mix-blend-screen"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
            radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04), transparent 60%)
          `,
          backgroundSize: '100% 2px, 100% 100%'
        }}
      />
      {/* Glitching title */}
      <div className="text-3xl tracking-[0.35em] text-white/90 font-semibold">
        PHANTOM CONSOLE
      </div>
      {/* Flicker */}
      <div className="absolute inset-0"
        style={{ animation: 'bootFlicker 2s linear both' }}
      />
      <button
        className="absolute bottom-6 px-3 py-1 rounded bg-white/10 text-xs"
        onClick={() => {
          setShow(false);
          sessionStorage.setItem('boot_seq_done', '1');
        }}
      >
        Skip
      </button>
      <style>{`
        @keyframes bootFlicker {
          0% { opacity: 1; }
          5% { opacity: 0.2; }
          9% { opacity: 1; }
          12% { opacity: 0.1; }
          15% { opacity: 1; }
          20% { opacity: 0.2; }
          25% { opacity: 1; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};