export async function speakAzureTTSProxy(text: string) {
  const base = import.meta.env.VITE_PROXY_BASE_URL as string;
  const voice = import.meta.env.VITE_AZURE_TTS_VOICE as string;
  if (!base || !voice) throw new Error('Not configured');
  const res = await fetch(`${base}/azure/tts/${encodeURIComponent(voice)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text })
  });
  if (!res.ok) throw new Error('TTS proxy error');
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = new Audio(url);
  a.play().catch(() => {});
}