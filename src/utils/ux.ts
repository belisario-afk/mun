// Minimal SFX + haptics utilities respecting Low Power and Reduced Motion
import { useStore } from '../store/store';

let ctx: AudioContext | null = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

function canPlay() {
  const st = useStore.getState();
  return !st.ui.lowPower; // we still allow brief tones in reducedMotion unless lowPower
}

function tone(freq: number, durMs: number, type: OscillatorType = 'sine', gain = 0.03) {
  const ac = getCtx();
  if (!ac || !canPlay()) return;
  const o = ac.createOscillator();
  const g = ac.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g).connect(ac.destination);
  const now = ac.currentTime;
  o.start(now);
  o.stop(now + durMs / 1000);
  // quick envelope to avoid clicks
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(gain, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + durMs / 1000);
}

export function sfxOpen() {
  tone(440, 80, 'triangle', 0.03);
  tone(660, 100, 'sine', 0.02);
}

export function sfxClose() {
  tone(330, 90, 'triangle', 0.03);
  tone(220, 110, 'sine', 0.02);
}

export function sfxToggle() {
  tone(520, 60, 'square', 0.02);
}

export function vibrateShort() {
  try {
    const st = useStore.getState();
    if (st.ui.reducedMotion || st.ui.lowPower) return;
    if (navigator.vibrate) navigator.vibrate(10);
  } catch {
    // ignore
  }
}