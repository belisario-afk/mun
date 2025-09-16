import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { voiceSpeak } from '../../tts';

export const StealthMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ui = useStore((s) => s.ui);
  const actions = useStore((s) => s.actions);
  const ai = useStore((s) => s.ai);
  const theme = useStore((s) => s.theme);

  return (
    <>
      <button
        className="absolute bottom-2 left-2 bg-slate-800/80 px-3 py-2 rounded"
        aria-expanded={open}
        aria-controls="stealth-menu-panel"
        aria-label="Open menu"
        onClick={() => setOpen((v) => !v)}
      >
        Menu
      </button>
      {open && (
        <div
          id="stealth-menu-panel"
          className="absolute bottom-14 left-2 bg-black/70 p-4 rounded w-[360px] max-w-[90vw] space-y-3"
        >
          <div className="text-lg">Stealth Menu</div>
          <div className="grid grid-cols-2 gap-2">
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => actions.toggleExpanded(false)}
              aria-pressed={!ui.expanded}
            >
              Stealth HUD
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => actions.toggleExpanded(true)}
              aria-pressed={ui.expanded}
            >
              Expanded
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => actions.setReducedMotion(!ui.reducedMotion)}
              aria-pressed={ui.reducedMotion}
            >
              Reduced Motion: {ui.reducedMotion ? 'On' : 'Off'}
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => actions.setHighContrast(!ui.highContrast)}
              aria-pressed={ui.highContrast}
            >
              High Contrast: {ui.highContrast ? 'On' : 'Off'}
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => actions.setLowPower(!ui.lowPower)}
              aria-pressed={ui.lowPower}
            >
              Low Power: {ui.lowPower ? 'On' : 'Off'}
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                const next = theme.theme === 'spyTech' ? 'tacticalStealth' : 'spyTech';
                actions.setTheme(next as any);
                voiceSpeak(`Theme set to ${next.replace(/([A-Z])/g, ' $1')}`);
              }}
            >
              Toggle Theme
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => useStore.setState({ ai: { ...ai, enabled: !ai.enabled } })}
              aria-pressed={ai.enabled}
            >
              AI: {ai.enabled ? 'On' : 'Off'}
            </button>
          </div>
          <div className="pt-2">
            <label className="block text-sm mb-1">Command</label>
            <CommandBar />
          </div>
        </div>
      )}
    </>
  );
};

const CommandBar: React.FC = () => {
  const [value, setValue] = useState('');
  const actions = useStore((s) => s.actions);
  const ai = useStore((s) => s.ai);
  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    actions.logAI('user', value.trim());
    const { dispatchAI } = await import('../../ai/dispatcher');
    await dispatchAI(value.trim());
    setValue('');
  };
  return (
    <form className="flex gap-2" onSubmit={onSubmit}>
      <input
        aria-label="AI command"
        placeholder={ai.enabled ? 'e.g., Set theme tactical' : 'AI disabled'}
        disabled={!ai.enabled}
        className="flex-1 bg-slate-900 rounded px-2 py-1"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="px-3 py-1 bg-slate-800 rounded" disabled={!ai.enabled}>
        Send
      </button>
    </form>
  );
};