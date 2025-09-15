import React from 'react';
import { useStore } from '../../store/store';

export const Toasts: React.FC = () => {
  const toasts = useStore((s) => s.ui.toasts);
  const clear = useStore((s) => s.actions.clearToast);
  return (
    <div className="fixed bottom-2 right-2 space-y-2 z-50">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          aria-live="polite"
          className={`px-3 py-2 rounded shadow ${t.level === 'error' ? 'bg-red-600' : t.level === 'warn' ? 'bg-yellow-600' : 'bg-slate-700'}`}
        >
          <div className="flex items-center gap-3">
            <span>{t.text}</span>
            <button
              className="px-2 py-1 bg-black/30 rounded text-xs"
              aria-label="Dismiss notification"
              onClick={() => clear(t.id)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};