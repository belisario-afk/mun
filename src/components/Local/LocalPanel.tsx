import React, { useEffect, useRef, useState } from 'react';
import { playFile } from '../../audio/local/local';
import { parseLRC, currentLrcLine } from '../../audio/local/lrc';
import { useStore } from '../../store/store';

export const LocalPanel: React.FC = () => {
  const active = useStore((s) => s.player.source === 'local');
  const actions = useStore((s) => s.actions);
  const [lrc, setLrc] = useState<ReturnType<typeof parseLRC>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Try to track audio currentTime when available
    const id = setInterval(() => {
      const el = (document.querySelector('audio[src^="blob:"]') || null) as HTMLAudioElement | null;
      audioRef.current = el;
      if (!el || !lrc.length) return;
      const line = currentLrcLine(lrc, el.currentTime || 0);
      if (line) {
        useStore.setState((s) => ({ ai: { ...s.ai, log: [...s.ai.log, { at: Date.now(), role: 'system', text: line }] } }));
      }
    }, 1000);
    return () => clearInterval(id);
  }, [lrc]);

  if (!active) return null;

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await playFile(file);
    // Try to locate .lrc next to file if provided via file picker session (cannot auto-access FS); allow user to load separately
    actions.toast('Local file playing. Load an LRC file to sync lyrics if available.');
  };

  const onPickLrc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setLrc(parseLRC(text));
    actions.toast('LRC loaded: ' + file.name);
  };

  return (
    <div
      className="absolute right-2 bottom-20 w-[360px] bg-black/60 rounded p-3 pointer-events-auto"
      aria-label="Local audio controls"
    >
      <div className="text-sm mb-2">Local Audio</div>
      <div className="space-y-2">
        <label className="block">
          <span className="text-xs opacity-80">Pick audio file</span>
          <input
            type="file"
            accept="audio/*"
            className="mt-1 w-full bg-slate-900 rounded p-2"
            onChange={onPick}
          />
        </label>
        <label className="block">
          <span className="text-xs opacity-80">Load .lrc (optional)</span>
          <input
            type="file"
            accept=".lrc,text/plain"
            className="mt-1 w-full bg-slate-900 rounded p-2"
            onChange={onPickLrc}
          />
        </label>
      </div>
    </div>
  );
};