import { useStore } from '../../store/store';
import { getAnalyser as getRadioAnalyser } from '../radio/radio';
import { getAnalyser as getLocalAnalyser } from '../local/local';

/** Returns analyser for the currently active audio source (radio/local), or null. */
export function getActiveAnalyser(): AnalyserNode | null {
  const source = useStore.getState().player.source;
  if (source === 'radio') return getRadioAnalyser();
  if (source === 'local') return getLocalAnalyser();
  return null;
}

/** Utility to read frequency data safely (handles TS lib typing variations) */
export function readFrequencies(target: Uint8Array | Float32Array): boolean {
  const an = getActiveAnalyser();
  if (!an) return false;
  // Cast to any to satisfy environments where lib.dom.d.ts expects Uint8Array<ArrayBuffer>
  (an as any).getByteFrequencyData(target as any);
  return true;
}