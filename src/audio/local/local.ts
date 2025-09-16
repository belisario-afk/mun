import { useStore } from '../../store/store';

export type LocalTrack = {
  id: string;
  name: string;
  url: string;
  file?: File;
  duration?: number;
};

let tracks: LocalTrack[] = [];
let currentId: string | null = null;

let audioEl: HTMLAudioElement | null = null;

// WebAudio graph for visualization (analyser)
let ctx: AudioContext | null = null;
let srcNode: MediaElementAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;

function ensureAudio() {
  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'metadata';
    audioEl.crossOrigin = 'anonymous';
  }
}

function ensureGraph() {
  ensureAudio();

  if (!audioEl) return;

  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
  }

  if (!srcNode) {
    srcNode = ctx.createMediaElementSource(audioEl!);
  }

  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
  }

  try {
    srcNode.disconnect();
  } catch {}
  try {
    analyser.disconnect();
  } catch {}

  srcNode.connect(analyser);
  analyser.connect(ctx.destination);
}

/** Public: analyser for local audio */
export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

export function getLocalTracks() {
  return tracks.slice();
}

export function addLocalFiles(files: FileList | File[]) {
  const arr = Array.from(files);
  for (const f of arr) {
    const url = URL.createObjectURL(f);
    tracks.push({
      id: `${f.name}-${f.size}-${f.lastModified}-${Math.random().toString(36).slice(2)}`,
      name: f.name,
      url,
      file: f
    });
  }
  if (!currentId && tracks.length) currentId = tracks[0]!.id;
}

export function setCurrentLocal(id: string) {
  if (tracks.find((t) => t.id === id)) currentId = id;
}

export function getCurrentLocal(): LocalTrack | null {
  return currentId ? tracks.find((t) => t.id === currentId) || null : null;
}

export async function playSample() {
  const st = useStore.getState();
  ensureGraph();
  try {
    await ctx?.resume();
  } catch {}

  const cur = getCurrentLocal() || tracks[0] || null;
  if (!cur) {
    st.actions.toast('No local files selected. Use the Local panel to add files.', 'warn');
    return;
  }

  ensureAudio();
  if (!audioEl) return;
  audioEl.src = cur.url;

  try {
    await audioEl.play();
    st.actions.setSource('local');
    st.actions.setPlayState(true);
    st.actions.setTrack({ id: cur.id, title: cur.name, artist: 'Local File' });
  } catch {
    st.actions.setPlayState(false);
    st.actions.toast('Autoplay blocked. Click and try Play again.', 'warn');
  }
}

export function pauseLocal() {
  if (!audioEl) return;
  try {
    audioEl.pause();
  } catch {}
  useStore.getState().actions.setPlayState(false);
}

export function stopLocal() {
  if (!audioEl) return;
  try {
    audioEl.pause();
    audioEl.currentTime = 0;
  } catch {}
  useStore.getState().actions.setPlayState(false);
}