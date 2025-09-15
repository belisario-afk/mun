import { useEffect } from 'react';
import { useStore } from '../store/store';

export function useWakeLock() {
  const setWake = useStore((s) => s.actions.setWakeLock);
  useEffect(() => {
    let wakeLock: any | null = null;
    let released = false;

    const request = async () => {
      try {
        // optional chaining for experimental API
        // @ts-ignore
        wakeLock = await navigator?.wakeLock?.request?.('screen');
        if (wakeLock) {
          setWake(true);
          wakeLock.addEventListener?.('release', () => setWake(false));
        } else {
          setWake(false);
        }
      } catch {
        setWake(false);
      }
    };

    const onVis = () => {
      if (document.visibilityState === 'visible' && !released) {
        request();
      }
    };

    document.addEventListener('visibilitychange', onVis);
    request();

    return () => {
      released = true;
      document.removeEventListener('visibilitychange', onVis);
      try {
        wakeLock?.release?.();
      } catch {}
      setWake(false);
    };
  }, [setWake]);
}