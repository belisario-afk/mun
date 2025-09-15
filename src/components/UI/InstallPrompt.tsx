import React, { useEffect, useState } from 'react';

export const InstallPrompt: React.FC = () => {
  const [evt, setEvt] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setEvt(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall as any);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall as any);
  }, []);

  if (!visible) return null;

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 p-3 rounded pointer-events-auto">
      <div className="text-sm mb-2">Install Phantom Console for car‑dock fullscreen?</div>
      <div className="flex gap-2 justify-end">
        <button
          className="px-3 py-1 bg-slate-800 rounded"
          onClick={async () => {
            if (!evt) return;
            await evt.prompt();
            setVisible(false);
          }}
        >
          Install
        </button>
        <button className="px-3 py-1 bg-slate-800 rounded" onClick={() => setVisible(false)}>
          Later
        </button>
      </div>
    </div>
  );
};