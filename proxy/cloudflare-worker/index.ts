export interface Env {
  ALLOW_ORIGIN?: string; // e.g., https://belisario-afk.github.io
  OPENAI_API_KEY?: string;
  AZURE_OPENAI_ENDPOINT?: string;
  AZURE_OPENAI_KEY?: string;
  ELEVENLABS_API_KEY?: string;
  PLAYHT_API_KEY?: string;
  GEMINI_API_KEY?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const allow = env.ALLOW_ORIGIN || 'https://belisario-afk.github.io';
    const cors = {
      'Access-Control-Allow-Origin': allow,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    try {
      // OpenAI Chat (expects body already in OpenAI format from client)
      if (url.pathname.startsWith('/openai/chat')) {
        const body = await request.json();
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        const json = await res.json();
        const content =
          json?.choices?.[0]?.message?.content ??
          (typeof json === 'string' ? json : JSON.stringify(json));
        const parsed = safeJSON(content);
        return jsonResponse(parsed, cors, res.status);
      }

      // Gemini Chat (simple text prompt passthrough; returns parsed JSON intent)
      if (url.pathname.startsWith('/gemini/chat/')) {
        const model = decodeURIComponent(url.pathname.split('/').pop() || '');
        const body = await request.json();
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts: [{ text: body.prompt }] }] })
          }
        );
        const text = await res.text();
        let parsed: any;
        try {
          const j = JSON.parse(text);
          const content = j?.candidates?.[0]?.content?.parts?.[0]?.text ?? text;
          parsed = safeJSON(content);
        } catch {
          parsed = safeJSON(text);
        }
        return jsonResponse(parsed, cors, res.status);
      }

      // Azure OpenAI Chat (normalized to JSON intent)
      if (url.pathname.startsWith('/azure/chat/')) {
        const deployment = decodeURIComponent(url.pathname.split('/').pop() || '');
        const body = await request.json();
        const res = await fetch(
          `${env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'api-key': `${env.AZURE_OPENAI_KEY}`
            },
            body: JSON.stringify({
              messages: [{ role: 'user', content: body.prompt }],
              temperature: 0.2,
              response_format: { type: 'json_object' }
            })
          }
        );
        const j = await res.json();
        const content = j?.choices?.[0]?.message?.content ?? JSON.stringify(j);
        const parsed = safeJSON(content);
        return jsonResponse(parsed, cors, res.status);
      }

      // ElevenLabs TTS
      if (url.pathname.startsWith('/elevenlabs/tts/')) {
        const voice = decodeURIComponent(url.pathname.split('/').pop() || '');
        const body = await request.json();
        const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}`, {
          method: 'POST',
          headers: {
            'xi-api-key': `${env.ELEVENLABS_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: body.text,
            voice_settings: { stability: 0.4, similarity_boost: 0.8 }
          })
        });
        return new Response(res.body, {
          headers: { ...cors, 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg' },
          status: res.status
        });
      }

      // PlayHT TTS (stream)
      if (url.pathname.startsWith('/playht/tts/')) {
        const voice = decodeURIComponent(url.pathname.split('/').pop() || '');
        const body = await request.json();
        const res = await fetch('https://api.play.ht/api/v2/tts/stream', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${env.PLAYHT_API_KEY}`
          },
          body: JSON.stringify({ text: body.text, voice })
        });
        return new Response(res.body, {
          headers: { ...cors, 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg' },
          status: res.status
        });
      }

      return new Response('Not found', { status: 404, headers: cors });
    } catch (e) {
      return new Response('Proxy error', { status: 500, headers: cors });
    }
  }
};

function jsonResponse(obj: unknown, headers: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(obj), {
    headers: { ...headers, 'Content-Type': 'application/json' },
    status
  });
}

function safeJSON(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return { intent: 'noop', args: {}, say: 'Acknowledged.' };
  }
}