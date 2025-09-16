import React, { useEffect, useState } from 'react';
import { getStations, getCurrentStation, setStation, startRadio, stopRadio } from '../../audio/radio/radio';
import { useStore } from '../../store/store';
import { hasUserGestured, waitForFirstGesture } from '../../utils/userGesture';

export const RightWingComms: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const playing = useStore((s) => s.player.playing);
  const source = useStore((s) => s.player.source);
  const [stations] = useState(getStations());
  const [current, setCurrent] = useState(getCurrentStation());

  useEffect(() => {
    setCurrent(getCurrentStation());
  }, [source, playing]);

  const onSelect = async (id: string) => {
    setStation(id);
    actions.setSource('radio');
    if (!hasUserGestured()) await waitForFirstGesture();
    await startRadio();
  };

  const onStop = () => {
    stopRadio();
    actions.setPlayState(false);
  };

  if (source !== 'radio') return null;

  return (
    <div className="absolute right-2 top-16 w-[360px] bg-black/60 rounded p-3 pointer-events-auto space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">Comms (Radio)</div>
        <div className="text-xs opacity-70">{playing && source === 'radio' ? 'Playing' : 'Idle'}</div>
      </div>

      <div className="max-h-72 overflow-auto space-y-1 pr-1">
        {stations.map((s) => (
          <button
            key={s.id}
            className={`w-full text-left px-2 py-2 rounded ${current?.id === s.id ? 'bg-emerald-800/70' : 'bg-slate-800/60 hover:bg-slate-700/60'}`}
            onClick={() => onSelect(s.id)}
            title={s.desc}
          >
            <div className="text-sm truncate">{s.name}</div>
            <div className="text-[11px] opacity-70 truncate">{s.desc}</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="px-3 py-2 bg-slate-800 rounded flex-1" onClick={() => current && onSelect(current.id)}>
          Play
        </button>
        <button className="px-3 py-2 bg-slate-800 rounded" onClick={onStop}>
          Stop
        </button>
      </div>
    </div>
  );
};