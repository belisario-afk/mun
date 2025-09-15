import React from 'react';
import { useStore } from '../../store/store';

export const RightWingComms: React.FC = () => {
  const ai = useStore((s) => s.ai);
  return (
    <div
      className="absolute right-2 top-16 w-[380px] bg-black/30 rounded p-3 max-h-[60vh] overflow-auto"
      aria-label="Comms and Tactical Log"
    >
      <div className="text-sm mb-2">Comms</div>
      <div className="space-y-2">
        {ai.log.slice(-100).map((m, i) => (
          <div key={i} className="text-xs">
            <span className="opacity-60 mr-2">[{new Date(m.at).toLocaleTimeString()}]</span>
            <span className="mr-2 uppercase opacity-80">{m.role}</span>
            <span className={m.role === 'system' ? 'text-emerald-400' : ''}>{m.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};