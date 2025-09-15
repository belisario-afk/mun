export async function azureProxyInvoke(prompt: string) {
  const base = import.meta.env.VITE_PROXY_BASE_URL as string;
  if (!base) throw new Error('No proxy configured');
  const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT as string;
  const res = await fetch(`${base}/azure/chat/${encodeURIComponent(deployment)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(`Proxy error ${res.status}`);
  return res.json();
}