import { useStore } from '../../store/store';

export async function speakWebSpeech(text: string) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  const voiceName = useStore.getState().voice.ttsVoice;
  const voice = speechSynthesis.getVoices().find((v) => v.name === voiceName);
  if (voice) u.voice = voice;
  u.rate = 1.0;
  u.pitch = 1.0;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}