import { useStore } from '../store/store';
import { miniInvoke } from './providers/Mini';
import { webllmInvoke } from './providers/WebLLM';
import { openAIProxyInvoke } from './providers/OpenAIProxy';
import { azureProxyInvoke } from './providers/AzureProxy';
import { geminiProxyInvoke } from './providers/GeminiProxy';
import { voiceSpeak } from '../tts';

export async function dispatchAI(prompt: string) {
  const st = useStore.getState();
  if (!st.ai.enabled) return;

  useStore.setState((s) => ({ ai: { ...s.ai, active: true } }));
  try {
    const provider = st.ai.provider;
    let res: any;
    if (provider === 'mini') res = await miniInvoke(prompt);
    else if (provider === 'webllm') res = await webllmInvoke(prompt);
    else if (provider === 'openai') res = await openAIProxyInvoke(prompt);
    else if (provider === 'azure') res = await azureProxyInvoke(prompt);
    else if (provider === 'gemini') res = await geminiProxyInvoke(prompt);
    else res = await miniInvoke(prompt);

    // speak confirmation
    if (res?.say) voiceSpeak(res.say);
    return res;
  } finally {
    useStore.setState((s) => ({ ai: { ...s.ai, active: false } }));
  }
}