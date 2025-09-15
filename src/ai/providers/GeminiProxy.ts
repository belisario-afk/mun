export async function geminiProxyInvoke(prompt: string) {
  const base = import.meta.env.VITE_PROXY_BASE_URL as string;
  if (!base) throw new Error('No proxy configured');
  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
  const res = await fetch(`${base}/gemini/chat/${encodeURIComponent(model)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}