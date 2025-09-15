import { useStore } from '../../store/store';

export async function openAIProxyInvoke(prompt: string) {
  const base = import.meta.env.VITE_PROXY_BASE_URL as string;
  if (!base) throw new Error('No proxy configured');
  const model = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o-mini';

  const res = await fetch(`${base}/openai/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt() },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2
    })
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  const json = await res.json();
  const parsed = safeParse(json.intent || json);
  useStore.getState().actions.logAI('assistant', parsed.say || 'Acknowledged.');
  return parsed;
}

function systemPrompt() {
  return `You are Phantom Console Copilot. Return ONLY a strict JSON with fields intent, args, say. Redact secrets. Short confirmations.`;
}

function safeParse(x: any) {
  if (typeof x === 'object') return x;
  try {
    return JSON.parse(x);
  } catch {
    return { intent: 'noop', args: {}, say: 'Acknowledged.' };
  }
}