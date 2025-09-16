import React, { useState } from 'react';
import { useStore } from '../../store/store';
import { voiceSpeak } from '../../tts';
import { sfxToggle, sfxOpen, sfxClose, vibrateShort } from '../../utils/ux';

export const StealthMenu: React.FC = () => {
  const [open, setOpen] = useState(false);
  const ui = useStore((s) => s.ui);
  const actions = useStore((s) => s.actions);
  const ai = useStore((s) => s.ai);
  const theme = useStore((s) => s.theme);
  const source = useStore((s) => s.player.source);

  return (
    <>
      <button
        className="absolute bottom-2 left-2 bg-slate-800/80 px-3 py-2 rounded"
        aria-expanded={open}
        aria-controls="stealth-menu-panel"
        aria-label="Open menu"
        onClick={() => {
          setOpen((v) => !v);
          sfxOpen();
          vibrateShort();
        }}
      >
        Menu
      </button>
      {open && (
        <div
          id="stealth-menu-panel"
          className="absolute bottom-14 left-2 bg-black/70 p-4 rounded w-[420px] max-w-[92vw] space-y-3"
        >
          <div className="text-lg">Stealth Menu</div>

          {/* Source selection */}
          <div className="grid grid-cols-3 gap-2">
            {(['spotify', 'radio', 'local'] as const).map((s) => (
              <button
                key={s}
                className={`px-2 py-2 rounded ${source === s ? 'bg-emerald-700' : 'bg-slate-800'}`}
                onClick={() => {
                  actions.setSource(s);
                  sfxToggle();
                  vibrateShort();
                }}
                aria-pressed={source === s}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.toggleExpanded(false);
                sfxClose();
                vibrateShort();
              }}
              aria-pressed={!ui.expanded}
            >
              Stealth HUD
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.toggleExpanded(true);
                sfxOpen();
                vibrateShort();
              }}
              aria-pressed={ui.expanded}
            >
              Expanded
            </button>

            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.setVisualFX(!ui.visualFX);
                sfxToggle();
                vibrateShort();
              }}
              aria-pressed={ui.visualFX}
            >
              Visual FX: {ui.visualFX ? 'On' : 'Off'}
            </button>

            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.setParallax(!ui.parallax);
                sfxToggle();
                vibrateShort();
              }}
              aria-pressed={ui.parallax}
            >
              Parallax: {ui.parallax ? 'On' : 'Off'}
            </button>

            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.setBootSequence(!ui.bootSequence);
                sfxToggle();
                vibrateShort();
              }}
              aria-pressed={ui.bootSequence}
            >
              Boot Sequence: {ui.bootSequence ? 'On' : 'Off'}
            </button>

            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.setReducedMotion(!ui.reducedMotion);
                sfxToggle();
                vibrateShort();
              }}
              aria-pressed={ui.reducedMotion}
            >
              Reduced Motion: {ui.reducedMotion ? 'On' : 'Off'}
            </button>

            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.setHighContrast(!ui.highContrast);
                sfxToggle();
                vibrateShort();
              }}
              aria-pressed={ui.highContrast}
            >
              High Contrast: {ui.highContrast ? 'On' : 'Off'}
            </button>

            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                actions.setLowPower(!ui.lowPower);
                sfxToggle();
                vibrateShort();
              }}
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
                sfxToggle();
              }}
            >
              Toggle Theme
            </button>
            <button
              className="px-2 py-2 bg-slate-800 rounded"
              onClick={() => {
                useStore.setState({ ai: { ...ai, enabled: !ai.enabled } });
                sfxToggle();
              }}
              aria-pressed={ai.enabled}
            >
              AI: {ai.enabled ? 'On' : 'Off'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};