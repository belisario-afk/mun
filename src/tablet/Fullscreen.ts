import { useEffect } from 'react';
import { useStore } from '../store/store';

export function useFullscreen() {
  const setFs = useStore((s) => s.actions.setFullscreen);
  useEffect(() => {
    const onChange = () => setFs(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, [setFs]);
}

export async function requestFullscreen(el: HTMLElement = document.documentElement) {
  if (!document.fullscreenElement) {
    await el.requestFullscreen?.().catch(() => {});
  }
}