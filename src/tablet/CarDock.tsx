import React, { useEffect } from 'react';
import { useStore } from '../store/store';

export const CarDockManager: React.FC = () => {
  const setCarDock = useStore((s) => s.actions.setCarDock);
  useEffect(() => {
    const update = () => {
      const inStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone;
      setCarDock(!!inStandalone);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('visibilitychange', update);
    };
  }, [setCarDock]);
  return null;
};