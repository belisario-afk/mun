import { useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { setActiveAnalyser } from './dsp/analyser';

// Optional imports (present in repo):
import { stopRadio } from './radio/radio';
import { pauseLocal, stopLocal } from './local/local';
import { spotifyPlayPause } from './spotify/spotify';

/**
 * Central guard that:
 * - On source change: stops any other playing source, clears analyser to avoid overlayed visuals/audio.
 * - Keeps playing flag coherent when external APIs fail to pause.
 */
export function SourceController() {
  const source = useStore((s) => s.player.source);
  const playing = useStore((s) => s.player.playing);
  const setPlay = useStore((s) => s.actions.setPlayState);
  const prevSource = useRef(source);

  useEffect(() => {
    if (prevSource.current === source) return;

    // Always clear active analyser on source switch.
    setActiveAnalyser(null);

    const from = prevSource.current;
    const to = source;

    // Stop everything that is not the new source.
    async function stopOthers() {
      try {
        if (from === 'radio' || to !== 'radio') {
          try { stopRadio(); } catch {}
        }
        if (from === 'local' || to !== 'local') {
          try { pauseLocal(); } catch {}
          try { stopLocal(); } catch {}
        }
        if (from === 'spotify' || to !== 'spotify') {
          try { await spotifyPlayPause(false); } catch {}
        }
      } finally {
        // Reset play state; individual source components will set it appropriately on real play.
        setPlay(false);
      }
    }

    void stopOthers();
    prevSource.current = source;
  }, [source, setPlay]);

  // If we somehow show playing=true while analyser is null and user switches source: normalize.
  useEffect(() => {
    if (!playing) return;
    // If analyser is not provided by current source quickly, we still allow time-based visuals,
    // but we ensure other sources are paused above.
  }, [playing]);

  return null;
}