import { intentFromText } from '../intents/intentParser';
import { useStore } from '../../store/store';

// "Mini" provider is designed for low-latency command-and-control.
// It deterministically maps user text to JSON intent via local parser,
// simulating an o3-mini-style structured output with <500ms latency.
export async function miniInvoke(prompt: string) {
  const intent = intentFromText(prompt);
  useStore.getState().actions.logAI('assistant', intent.say);
  return intent;
}