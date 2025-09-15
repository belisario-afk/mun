import { getAnalyser as getRadioAnalyser } from '../radio/radio';
import { getLocalAnalyser } from '../local/local';

export function useAnalyserData(target: 'radio' | 'local' = 'radio') {
  const analyser = target === 'radio' ? getRadioAnalyser() : getLocalAnalyser();
  if (!analyser) return { waveform: new Uint8Array(), freq: new Uint8Array() };
  const waveform = new Uint8Array(analyser.fftSize);
  const freq = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteTimeDomainData(waveform);
  analyser.getByteFrequencyData(freq);
  return { waveform, freq };
}