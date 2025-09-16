// Simple global analyser registry so visuals can react to the current audio source.
// Sources may call setActiveAnalyser when they start/stop. CentralScope reads via getActiveAnalyser().

let active: AnalyserNode | null = null;

export function setActiveAnalyser(node: AnalyserNode | null) {
  active = node;
}

export function getActiveAnalyser(): AnalyserNode | null {
  return active;
}

// Helper: Create an AnalyserNode for an <audio> element you control.
// Returns { context, analyser, source } so you can keep/cleanup references.
export function createAnalyserForMediaElement(audio: HTMLMediaElement, opts?: { fftSize?: number; smoothing?: number }) {
  const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
  const ctx = new AudioCtx();
  const source = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = opts?.fftSize ?? 2048;
  analyser.smoothingTimeConstant = opts?.smoothing ?? 0.8;

  source.connect(analyser);
  analyser.connect(ctx.destination);

  return { context: ctx, analyser, source };
}