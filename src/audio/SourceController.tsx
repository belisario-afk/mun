import React, { useEffect } from 'react';
import { useStore } from '../store/store';
import { startRadio, stopRadio } from './radio/radio';
import { playSample, stopLocal } from './local/local';

export const SourceController: React.FC = () => {
  const source = useStore((s) => s.player.source);

  useEffect(() => {
    async function apply() {
      stopRadio();
      stopLocal();
      if (source === 'radio') {
        await startRadio().catch(() => {});
      } else if (source === 'local') {
        await playSample().catch(() => {});
      } else if (source === 'spotify') {
        // Spotify controlled via SpotifyPanel
      }
    }
    apply();
  }, [source]);

  return null;
};