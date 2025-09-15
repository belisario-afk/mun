import { useStore } from '../store/store';
import { speakWebSpeech } from './providers/WebSpeech';
import { speakElevenLabsProxy } from './providers/ElevenLabsProxy';
import { speakAzureTTSProxy } from './providers/AzureTTSProxy';
import { speakPlayHTProxy } from './providers/PlayHTProxy';
import { duckAmbient } from '../audio/ambient/ambient';

export async function voiceSpeak(text: string) {
  const provider = useStore.getState().voice.ttsProvider;
  try {
    duckAmbient(true);
    if (provider === 'elevenlabs') return await speakElevenLabsProxy(text);
    if (provider === 'azure') return await speakAzureTTSProxy(text);
    if (provider === 'playht') return await speakPlayHTProxy(text);
    return await speakWebSpeech(text);
  } catch (e) {
    try {
      return await speakWebSpeech(text);
    } catch {
      useStore.getState().actions.logAI('assistant', text);
    }
  } finally {
    setTimeout(() => duckAmbient(false), 100);
  }
}