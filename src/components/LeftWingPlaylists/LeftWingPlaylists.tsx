import React from 'react';
import { useStore } from '../../store/store';

export const LeftWingPlaylists: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const playlists = [
    { id: 'energy', name: 'Energy Ops', energy: 0.9 },
    { id: 'focus', name: 'Focus Vector', energy: 0.4 },
    { id: 'night', name: 'Night Patrol', energy: 0.6 }
  ];
  return (
    <div
      className="absolute left-2 top-16 w-[280px] bg-black/30 rounded p-3"
      aria-label="Playlists panel"
    >
      <div className="text-sm mb-2">Playlists Radar</div>
      <div className="grid grid-cols-1 gap-2">
        {playlists.map((p) => (
          <button
            key={p.id}
            className="px-2 py-2 bg-slate-800/70 rounded text-left"
            onClick={() => {
              actions.toast(`Lock-on: ${p.name}`);
              actions.setSource('spotify');
              useStore.getState().actions.logAI('system', `Playlist "${p.name}" selected.`);
            }}
            aria-label={`Playlist ${p.name}`}
          >
            <div className="flex justify-between">
              <span>{p.name}</span>
              <span className="opacity-70">energy {Math.round(p.energy * 100)}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};