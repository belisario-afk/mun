import React, { useEffect, useMemo, useState } from 'react';
import {
  initializeSpotifySDK,
  spotifyCreatePlayer,
  spotifyDevices,
  spotifyLogin,
  spotifyLogout,
  spotifyPlayPause,
  spotifyTransferPlayback,
  spotifyNext
} from '../../audio/spotify/spotify';
import { useStore } from '../../store/store';

type TrackItem = {
  id: string;
  name: string;
  artists: string;
  uri: string;
  albumArt: string | null;
};

async function spotifySearchTracks(accessToken: string, q: string): Promise<TrackItem[]> {
  const url = `https://api.spotify.com/v1/search?type=track&limit=20&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error('Spotify search failed');
  const data = await res.json();
  const items: any[] = data?.tracks?.items ?? [];
  return items.map((t) => ({
    id: t.id,
    name: t.name,
    artists: (t.artists || []).map((a: any) => a.name).join(', '),
    uri: t.uri,
    albumArt: t.album?.images?.[2]?.url || t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null
  })) as TrackItem[];
}

async function spotifyPlayTrack(accessToken: string, deviceId: string | undefined, uri: string) {
  const url = `https://api.spotify.com/v1/me/player/play${deviceId ? `?device_id=${encodeURIComponent(deviceId)}` : ''}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ uris: [uri] })
  });
  if (!res.ok && res.status !== 204) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify play failed: ${res.status} ${text}`);
  }
}

export const SpotifyPanel: React.FC = () => {
  const playerState = useStore((s) => s.player);
  const actions = useStore((s) => s.actions);
  const auth = useStore((s) => s.auth.spotify);
  const [devices, setDevices] = useState<{ id: string; name: string; is_active: boolean }[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<TrackItem[]>([]);
  const active = playerState.source === 'spotify';

  const loggedIn = !!auth.accessToken;
  const premium = !!auth.premium;
  const activeDeviceId = useMemo(() => auth.deviceId || devices.find((d) => d.is_active)?.id, [auth.deviceId, devices]);

  // Create SDK player when Spotify is the source and logged in
  useEffect(() => {
    if (!active || !loggedIn) return;
    (async () => {
      await initializeSpotifySDK().catch(() => {});
      await spotifyCreatePlayer();
    })();
  }, [active, loggedIn]);

  // Poll devices so user can transfer
  useEffect(() => {
    let mounted = true;

    async function poll() {
      if (!active || !loggedIn) return;
      try {
        const list = await spotifyDevices();
        if (mounted) setDevices(list);
      } catch {
        // ignore
      }
    }

    poll();
    const id = setInterval(poll, 10000);
    return () => {
      mounted = false;
      clearInterval(id);
    };
  }, [active, loggedIn]);

  const onSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim() || !auth.accessToken) return;
    setLoading(true);
    try {
      const rows = await spotifySearchTracks(auth.accessToken, q.trim());
      setResults(rows);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const onPlayTrack = async (uri: string) => {
    if (!auth.accessToken) return;
    if (!active) actions.setSource('spotify');
    try {
      await spotifyPlayTrack(auth.accessToken, activeDeviceId, uri);
      actions.setPlayState(true);
    } catch {
      // no-op
    }
  };

  if (!active) return null;

  return (
    <div
      className="absolute left-2 bottom-20 w-[380px] bg-black/60 rounded p-3 pointer-events-auto space-y-3"
      aria-label="Spotify controls"
    >
      <div className="flex items-center justify-between">
        <div className="text-sm">Spotify</div>
        <div className="text-xs opacity-70">
          {loggedIn ? (premium ? 'Premium connected' : 'Free connected') : 'Logged out'}
        </div>
      </div>

      {!loggedIn ? (
        <button
          className="px-3 py-2 bg-green-700 rounded w-full"
          onClick={() => spotifyLogin()}
          title="Connect your Spotify account"
        >
          Login with Spotify
        </button>
      ) : !premium ? (
        <div className="space-y-2">
          <div className="text-xs opacity-80">
            Spotify Web Playback SDK requires Premium to play in the browser.
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 bg-slate-800 rounded flex-1" onClick={() => spotifyLogout()}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <form className="flex gap-2" onSubmit={onSearch}>
            <input
              className="flex-1 bg-slate-900 rounded px-2 py-2 text-sm"
              placeholder="Search songs, artists…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            <button className="px-3 py-2 bg-slate-800 rounded" type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Search'}
            </button>
          </form>

          {results.length > 0 && (
            <div className="max-h-48 overflow-auto space-y-1 pr-1">
              {results.map((t) => (
                <button
                  key={t.id}
                  className="w-full px-2 py-2 rounded bg-slate-800/60 hover:bg-slate-700/60 text-left flex items-center gap-2"
                  onClick={() => onPlayTrack(t.uri)}
                  title={`${t.name} — ${t.artists}`}
                >
                  {t.albumArt ? (
                    <img src={t.albumArt} alt="" className="w-8 h-8 rounded object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-700" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm truncate">{t.name}</div>
                    <div className="text-[11px] opacity-70 truncate">{t.artists}</div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              className="px-3 py-2 bg-slate-800 rounded flex-1"
              onClick={async () => {
                if (!active) actions.setSource('spotify');
                await spotifyPlayPause(!playerState.playing);
              }}
              aria-label={playerState.playing ? 'Pause' : 'Play'}
            >
              {playerState.playing ? 'Pause' : 'Play'}
            </button>
            <button className="px-3 py-2 bg-slate-800 rounded" onClick={() => spotifyNext()}>
              Next
            </button>
            <select
              className="px-2 py-2 bg-slate-900 rounded flex-1"
              onChange={(e) => e.target.value && spotifyTransferPlayback(e.target.value)}
              value={activeDeviceId || ''}
              title="Device"
            >
              <option value="" disabled>
                Choose device
              </option>
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} {d.is_active ? '(active)' : ''}
                </option>
              ))}
            </select>
            <button className="px-3 py-2 bg-slate-800 rounded" onClick={() => spotifyLogout()}>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};