import React from 'react';
import { useStore } from '../../store/store';
import type { Source } from '../../store/store';

export const TogglePaddles: React.FC = () => {
  const source = useStore((s) => s.player.source);
  const setSource = useStore((s) => s.actions.setSource);

  const order: Source[] = ['spotify', 'radio', 'local'];
  const next = () => {
    const idx = order.indexOf(source);
    const s = order[(idx + 1) % order.length] as Source;
    setSource(s);
  };
  const prev = () => {
    const idx = order.indexOf(source);
    const s = order[(idx - 1 + order.length) % order.length] as Source;
    setSource(s);
  };

  return (
    <div className="flex gap-6 items-center" aria-label="Source toggles">
      <button
        className="px-4 py-3 bg-slate-800/80 rounded min-w-20"
        onClick={prev}
        aria-label="Previous source"
      >
        ←
      </button>
      <span aria-live="polite" className="text-sm">
        Source: {source}
      </span>
      <button
        className="px-4 py-3 bg-slate-800/80 rounded min-w-20"
        onClick={next}
        aria-label="Next source"
      >
        →
      </button>
    </div>
  );
};