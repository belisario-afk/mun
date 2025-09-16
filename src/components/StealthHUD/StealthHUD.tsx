import React, { useEffect, useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { useStore } from '../../store/store';
import { getActiveAnalyser } from '../../audio/dsp/analyser';
import { AudioGrid } from './layers/AudioGrid';
import { SweepArcs } from './layers/SweepArcs';
import { RefractionOverlay } from './layers/RefractionOverlay';
import { useFLIP } from './anim/useFLIP';

type PanelSpec = {
  id: string;
  title: string;
  desc?: string;
  align: 'left' | 'right';
};

const panels: PanelSpec[] = [
  { id: 'nav', title: 'NAV', desc: 'Waypoints + ETA', align: 'left' },
  { id: 'sensors', title: 'SENSORS', desc: 'Env + Weather', align: 'left' },
  { id: 'comms', title: 'COMMS', desc: 'Radio / Spotify', align: 'right' },
  { id: 'ops', title: 'OPS', desc: 'Mission State', align: 'right' }
];

export const StealthHUD: React.FC = () => {
  const ui = useStore((s) => s.ui);
  const theme = useStore((s) => s.theme);
  const playing = useStore((s) => s.player.playing);
  const scopeMode = useStore((s) => s.ui.scopeMode);

  // Audio energy feed for DOM animations
  const [energy, setEnergy] = useState(0);
  useFrameFPSAware(() => {
    const a = getActiveAnalyser();
    if (!a) {
      setEnergy((prev) => prev * 0.9);
      return;
    }
    const buf = new Uint8Array(a.frequencyBinCount);
    (a as any).getByteFrequencyData(buf);
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i]!;
    const avg = sum / (buf.length || 1);
    const norm = Math.min(1, Math.max(0, avg / 200));
    setEnergy((prev) => 0.85 * prev + 0.15 * norm);
  });

  const leftPanels = useMemo(() => panels.filter((p) => p.align === 'left'), []);
  const rightPanels = useMemo(() => panels.filter((p) => p.align === 'right'), []);

  const glow = Math.round(40 + energy * 60);

  return (
    <div
      className={[
        'absolute inset-0',
        // Root overlay ignores pointer events by default to avoid trapping clicks under it.
        'pointer-events-none',
        ui.reducedMotion ? 'prefers-reduced-motion' : ''
      ].join(' ')}
      aria-label="Stealth HUD"
    >
      {/* R3F overlay: explicitly disable events so it never captures clicks */}
      <div className="absolute inset-0 pointer-events-none">
        <Canvas
          dpr={[0.7, 1.0]}
          frameloop="always"
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
            // Safety: ensure canvas doesn't eat events
            const el = gl.domElement as HTMLCanvasElement;
            el.style.pointerEvents = 'none';
          }}
        >
          <group>
            <AudioGrid />
            <SweepArcs />
            <RefractionOverlay />
          </group>
        </Canvas>
      </div>

      {/* Panel cluster (left/right) — these are clickable */}
      <div className="absolute inset-0 grid grid-cols-2 gap-2 p-3">
        <div className="flex flex-col gap-2">
          {leftPanels.map((p, i) => (
            <Panel
              key={p.id}
              title={p.title}
              desc={p.desc}
              energy={energy}
              accent={theme.accent}
              revealDelayMs={(i + 1) * 60}
            />
          ))}
        </div>
        <div className="flex flex-col gap-2 items-end">
          {rightPanels.map((p, i) => (
            <Panel
              key={p.id}
              title={p.title}
              desc={p.desc}
              energy={energy}
              accent={theme.accent}
              right
              revealDelayMs={(i + 1) * 60}
            />
          ))}
        </div>
      </div>

      {/* Minimal center indicator */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] opacity-80 tracking-[0.25em] pointer-events-none">
        {playing ? 'LIVE' : 'STANDBY'} · {scopeMode?.toUpperCase?.() ?? 'RING'}
      </div>

      {/* Soft outer vignette tied to energy */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at center, rgba(0,0,0,0) 50%, rgba(0,0,0,${0.18 + energy * 0.12}) 80%)`,
          filter: `saturate(${1 + energy * 0.15})`
        }}
      />

      {/* Soft neon border pulse */}
      <div
        className="absolute inset-1 rounded pointer-events-none"
        style={{
          boxShadow: `0 0 ${glow}px ${Math.round(glow / 4)}px ${theme.accent || '#58e7ff'}40 inset`
        }}
      />
    </div>
  );
};

function Panel({
  title,
  desc,
  energy,
  accent,
  right,
  revealDelayMs = 60
}: {
  title: string;
  desc?: string | undefined;
  energy: number;
  accent?: string | undefined;
  right?: boolean;
  revealDelayMs?: number;
}) {
  const flip = useFLIP({ spring: 0.08, damping: 0.85 });

  useEffect(() => {
    flip.measure();
    const timer = window.setTimeout(() => {
      flip.measure();
      flip.play();
    }, revealDelayMs);
    return () => window.clearTimeout(timer);
  }, [revealDelayMs, flip]);

  return (
    <div
      ref={(el) => {
        flip.setNode(el);
      }}
      className={[
        // Make panels interactive even under a pointer-events-none parent
        'pointer-events-auto select-none rounded',
        'bg-black/45 backdrop-blur-[1px]',
        'border border-white/10',
        'px-3 py-2 w-[260px]',
        right ? 'origin-right' : 'origin-left'
      ].join(' ')}
      style={{
        transform: flip.transform,
        transition: 'box-shadow 120ms ease',
        boxShadow: `0 0 ${Math.round(8 + energy * 16)}px ${Math.round(2 + energy * 6)}px ${(accent || '#58e7ff')}20`
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-xs opacity-80">{title}</div>
        <div
          className="w-2 h-2 rounded-full"
          style={{
            background: accent || '#58e7ff',
            boxShadow: `0 0 ${Math.round(4 + energy * 10)}px ${(accent || '#58e7ff')}`
          }}
          aria-hidden
        />
      </div>
      {desc && <div className="text-[10px] opacity-60 mt-1">{desc}</div>}
    </div>
  );
}

function useFrameFPSAware(fn: () => void) {
  const fnRef = React.useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);

  useEffect(() => {
    let r = 0;
    const tick = () => {
      fnRef.current();
      r = requestAnimationFrame(tick);
    };
    r = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(r);
  }, []);
}