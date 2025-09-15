export async function speakElevenLabsProxy(text: string) {
  const base = import.meta.env.VITE_PROXY_BASE_URL as string;
  const voiceId = import.meta.env.VITE_ELEVENLABS_VOICE_ID as string;
  if (!base || !voiceId) throw new Error('Not configured');
  const res = await fetch(`${base}/elevenlabs/tts/${voiceId}`, {
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