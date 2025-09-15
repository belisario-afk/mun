let amb: HTMLAudioElement | null = null;
let baseVolume = 0.15;

export function startAmbient() {
  if (amb) return;
  amb = new Audio();
  amb.loop = true;
  // tiny data URI pink-ish noise loop (legal, generated)
  amb.src =
    'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQgAAAAA/////wAAAP///wAAAP///wAAAP///wAAAP///w==';
  amb.volume = baseVolume;
  amb.play().catch(() => {});
}

export function duckAmbient(active: boolean) {
  if (!amb) return;
  amb.volume = active ? baseVolume * 0.2 : baseVolume;
}

export function stopAmbient() {
  amb?.pause();
  amb = null;
}