import { useStore } from '../../store/store';

let audioEl: HTMLAudioElement | null = null;
let analyser: AnalyserNode | null = null;
let ctx: AudioContext | null = null;

export const radioStreams = [
  {
    id: 'soma-groove',
    name: 'SomaFM Groove Salad',
    url: 'https://ice2.somafm.com/groovesalad-128-mp3'
  },
  {
    id: 'soma-defcon',
    name: 'SomaFM DEF CON Radio',
    url: 'https://ice6.somafm.com/defcon-128-mp3'
  }
] as const;

export function getAnalyser() {
  return analyser;
}

export async function startRadio(id?: string) {
  const stream = id
    ? radioStreams.find((s) => s.id === id)
    : radioStreams[0];
  if (!stream) {
    useStore.getState().actions.toast('No radio streams configured', 'error');
    return;
  }

  if (!audioEl) audioEl = new Audio();
  audioEl.crossOrigin = 'anonymous';
  audioEl.src = stream.url;
  audioEl.loop = false;
  audioEl.preload = 'auto';
  audioEl.autoplay = true;
  audioEl.play().catch((e) => console.warn('Autoplay blocked until gesture', e));

  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const src = ctx.createMediaElementSource(audioEl);
  analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;
  src.connect(analyser);
  analyser.connect(ctx.destination);

  useStore.getState().actions.setPlayState(true);
  useStore.getState().actions.toast('Radio started: ' + stream.name);
}

export function stopRadio() {
  if (audioEl) {
    audioEl.pause();
    audioEl.src = '';
  }
  analyser?.disconnect();
  useStore.getState().actions.setPlayState(false);
}