import { useStore } from '../../store/store';

type Station = {
  id: string;
  name: string;
  url: string;
  desc?: string;
};

const STATIONS: Station[] = [
  {
    id: 'groove-salad',
    name: 'SomaFM: Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    desc: 'Chilled, ambient, downtempo'
  },
  {
    id: 'defcon',
    name: 'SomaFM: DEFCON Radio',
    url: 'https://ice4.somafm.com/defcon-128-mp3',
    desc: 'Music used at DEF CON'
  },
  {
    id: 'synthwave',
    name: 'SomaFM: Synthwave',
    url: 'https://ice1.somafm.com/defcon-256-mp3',
    desc: 'Retro electro / synthwave'
  }
];

// Non-null assertion since we define at least one station above.
let currentStation: Station = STATIONS[0]!;

// HTML media element used for radio playback
let audioEl: HTMLAudioElement | null = null;

// WebAudio graph for visualization (analyser)
let ctx: AudioContext | null = null;
let srcNode: MediaElementAudioSourceNode | null = null;
let analyser: AnalyserNode | null = null;

function ensureAudioGraph() {
  if (!audioEl) return;

  if (!ctx) {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    ctx = new AC();
  }

  // Create or re-create the media source node if needed
  if (!srcNode) {
    srcNode = ctx.createMediaElementSource(audioEl);
  }

  if (!analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.85;
  }

  // Connect: source -> analyser -> destination
  try {
    // Avoid "already connected" errors by disconnecting first
    srcNode.disconnect();
  } catch {
    // ignore
  }
  try {
    analyser.disconnect();
  } catch {
    // ignore
  }
  srcNode.connect(analyser);
  analyser.connect(ctx.destination);
}

/**
 * Returns the shared WebAudio analyser used for radio visualization, or null
 * if the graph hasn't been initialized yet.
 */
export function getAnalyser(): AnalyserNode | null {
  return analyser;
}

export function getStations() {
  return STATIONS.slice();
}

export function setStation(id: string) {
  const s = STATIONS.find((x) => x.id === id);
  if (s) currentStation = s;

  // Show station name in the UI track area
  useStore.getState().actions.setTrack({
    id: currentStation.id,
    title: currentStation.name,
    artist: 'Internet Radio'
  });

  // If player is currently playing radio, switch source automatically
  if (audioEl && !audioEl.paused) {
    audioEl.src = currentStation.url;
  }
}

export function getCurrentStation() {
  return currentStation;
}

export async function startRadio() {
  const st = useStore.getState();

  if (!audioEl) {
    audioEl = new Audio();
    audioEl.preload = 'none';
    audioEl.crossOrigin = 'anonymous';
  }

  audioEl.src = currentStation.url;

  // Ensure analyser graph is prepared and AudioContext is resumed on gesture
  ensureAudioGraph();
  try {
    await ctx?.resume();
  } catch {
    // ignore
  }

  try {
    await audioEl.play();
    st.actions.setPlayState(true);
    st.actions.toast(`Radio started: ${currentStation.name}`, 'info');
  } catch {
    st.actions.setPlayState(false);
    st.actions.toast('Autoplay blocked. Click anywhere and try Play again.', 'warn');
  }
}

export function stopRadio() {
  if (audioEl) {
    try {
      audioEl.pause();
      audioEl.currentTime = 0;
    } catch {
      // ignore
    }
  }
  useStore.getState().actions.setPlayState(false);
}