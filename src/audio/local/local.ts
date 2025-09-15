import { useStore } from '../../store/store';

let audioEl: HTMLAudioElement | null = null;
let analyser: AnalyserNode | null = null;
let ctx: AudioContext | null = null;

export function getLocalAnalyser() {
  return analyser;
}

const SAMPLE_WAV_DATAURI =
  'data:audio/wav;base64,UklGRhQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA/////wAAAP///wAAAP///w==';
// tiny click loop (legal, generated)

export async function playSample() {
  if (!audioEl) audioEl = new Audio();
  audioEl.src = SAMPLE_WAV_DATAURI;
  audioEl.loop = true;
  audioEl.play().catch(() => {});
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const src = ctx.createMediaElementSource(audioEl);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  src.connect(analyser);
  analyser.connect(ctx.destination);
  useStore.getState().actions.setPlayState(true);
  useStore.getState().actions.setTrack({ id: 'sample', title: 'Sample Loop', artist: 'CC0' });
}

export async function playFile(file: File) {
  if (!audioEl) audioEl = new Audio();
  audioEl.src = URL.createObjectURL(file);
  audioEl.loop = false;
  await audioEl.play().catch(() => {});
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const src = ctx.createMediaElementSource(audioEl);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);
  analyser.connect(ctx.destination);
  useStore.getState().actions.setPlayState(true);
  useStore.getState().actions.setTrack({ id: 'local', title: file.name, artist: 'Local' });
}

export function stopLocal() {
  if (audioEl) {
    audioEl.pause();
    audioEl.src = '';
  }
  analyser?.disconnect();
  useStore.getState().actions.setPlayState(false);
}