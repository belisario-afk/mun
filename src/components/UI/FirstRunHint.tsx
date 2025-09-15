import React, { useState } from 'react';
import { voiceSpeak } from '../../tts';
import { startRadio } from '../../audio/radio/radio';
import { useStore } from '../../store/store';

export const FirstRunHint: React.FC = () => {
  const [hidden, setHidden] = useState(false);
  const playing = useStore((s) => s.player.playing);
  if (hidden || playing) return null;

  const engage = async () => {
    // User gesture: greet, try starting radio (autoplay may require this gesture)
    voiceSpeak('Phantom Console online. Standing by.');
    await startRadio().catch(() => {});
    setHidden(true);
  };

  return (
    <div
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-40"
      role="dialog"
      aria-label="First run hint"
    >
      <div className="bg-slate-900/90 p-6 rounded-lg max-w-[480px] text-center space-y-4">
        <div className="text-xl font-semibold">Phantom Console</div>
        <p className="opacity-80">
          Tap Engage to initialize audio, optional voice, and wake controls. You can enable mic later
          in the menu. Permissions are always opt-in.
        </p>
        <button
          onClick={engage}
          className="px-5 py-3 bg-slate-800 rounded text-lg"
          aria-label="Engage Phantom Console"
        >
          Engage
        </button>
      </div>
    </div>
  );
};