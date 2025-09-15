import React, { useEffect } from 'react';
import { useStore } from '../store/store';
import { startRadio, stopRadio } from './radio/radio';
import { playSample, stopLocal } from './local/local';
import { waitForFirstGesture, hasUserGestured } from '../utils/userGesture';

export const SourceController: React.FC = () => {
  const source = useStore((s) => s.player.source);

  useEffect(() => {
    let cancelled = false;

    async function apply() {
      // stop everything first
      stopRadio();
      stopLocal();

      if (source === 'radio') {
        if (!hasUserGestured()) await waitForFirstGesture();
        if (!cancelled) await startRadio().catch(() => {});
      } else if (source === 'local') {
        if (!hasUserGestured()) await waitForFirstGesture();
        if (!cancelled) await playSample().catch(() => {});
      }
      // spotify handled by SpotifyPanel
    }

    apply();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return null;
};