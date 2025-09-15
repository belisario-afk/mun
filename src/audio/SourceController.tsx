import React, { useEffect } from 'react';
import { useStore } from '../store/store';
import { startRadio, stopRadio } from './radio/radio';
import { playSample, stopLocal } from './local/local';

export const SourceController: React.FC = () => {
  const source = useStore((s) => s.player.source);

  useEffect(() => {
    let cancelled = false;
    async function apply() {
      // Stop everything first
      stopRadio();
      stopLocal();
      if (source === 'radio') {
        await startRadio().catch(() => {});
      } else if (source === 'local') {
        await playSample().catch(() => {});
      } else if (source === 'spotify') {
        // Spotify is controlled via the SpotifyPanel; nothing to start here.
      }
    }
    apply();
    return () => {
      cancelled = true;
    };
  }, [source]);

  return null;
};