import React, { useEffect, useRef, useState } from 'react';
import { useStore } from '../../store/store';

export const IrisMask: React.FC = () => {
  const expanded = useStore((s) => s.ui.expanded);
  const reducedMotion = useStore((s) => s.ui.reducedMotion);
  const [anim, setAnim] = useState<'open' | 'close' | null>(null);
  const timeout = useRef<number | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    setAnim(expanded ? 'open' : 'close');
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = window.setTimeout(() => setAnim(null), 650);
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, [expanded, reducedMotion]);

  if (!anim || reducedMotion) return null;

  const start = anim === 'open' ? '2% 2%' : '140% 140%';
  const end = anim === 'open' ? '140% 140%' : '2% 2%';

  return (
    <div className="absolute inset-0 z-40 pointer-events-none">
      <div
        className="absolute inset-0 bg-black"
        style={{
          WebkitMaskImage: `radial-gradient(circle at 50% 50%, transparent 0%, black 0%)`,
          maskImage: `radial-gradient(circle at 50% 50%, transparent 0%, black 0%)`,
          animation: `iris 650ms cubic-bezier(.2,.9,.1,1) both`
        }}
      />
      <style>{`
        @keyframes iris {
          0% { -webkit-mask-size: ${start}; mask-size: ${start}; }
          100% { -webkit-mask-size: ${end}; mask-size: ${end}; }
        }
      `}</style>
    </div>
  );
};