import { useStore } from '../store/store';

declare global {
  interface Window {
    webkitSpeechRecognition?: new () => any;
    SpeechRecognition?: new () => any;
  }
}

type Recog = {
  start: () => void;
  stop: () => void;
  abort?: () => void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((ev: any) => void) | null;
  onend: (() => void) | null;
  onaudioend?: (() => void) | null;
  onaudiostart?: (() => void) | null;
  onerror: ((ev: any) => void) | null;
} | null;

let recognition: Recog = null;

export function isSpeechRecognitionAvailable() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function ensureRecognition(): NonNullable<Recog> | null {
  if (!isSpeechRecognitionAvailable()) return null;
  if (recognition) return recognition as NonNullable<Recog>;
  const Ctor = (window.SpeechRecognition || window.webkitSpeechRecognition) as
    | (new () => any)
    | undefined;
  if (!Ctor) return null;
  const r = new Ctor();
  r.continuous = false;
  r.interimResults = true;
  r.lang = navigator.language || 'en-US';
  recognition = r;
  return r;
}

export function startListening() {
  const rec = ensureRecognition();
  const actions = useStore.getState().actions;
  if (!rec) {
    actions.toast('Speech recognition unavailable on this device', 'warn');
    return;
  }
  actions.setListening(true);
  rec.onresult = (e: any) => {
    let finalTranscript = '';
    for (let i = e.resultIndex; i < e.results.length; ++i) {
      const res = e.results[i];
      if (res?.isFinal) finalTranscript += res[0]?.transcript ?? '';
    }
    if (finalTranscript.trim()) {
      actions.logAI('user', finalTranscript.trim());
      import('../ai/dispatcher')
        .then(({ dispatchAI }) => dispatchAI(finalTranscript.trim()))
        .catch(() => {});
    }
  };
  rec.onend = () => {
    actions.setListening(false);
  };
  rec.onerror = () => {
    actions.setListening(false);
  };
  try {
    rec.start();
  } catch {
    actions.setListening(false);
  }
}

export function stopListening() {
  const rec = ensureRecognition();
  const actions = useStore.getState().actions;
  try {
    rec?.stop();
  } catch {
    rec?.abort?.();
  } finally {
    actions.setListening(false);
  }
}