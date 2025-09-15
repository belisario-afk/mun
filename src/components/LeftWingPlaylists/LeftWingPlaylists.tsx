import React, { useEffect, useMemo, useState } from 'react';
import {
  spotifyFetchPlaylists,
  spotifyLogin,
  spotifySearchTracks,
  spotifyStartPlaylist,
  type SpotifyPlaylist
} from '../../audio/spotify/spotify';
import { useStore } from '../../store/store';

export const LeftWingPlaylists: React.FC = () => {
  const auth = useStore((s) => s.auth.spotify);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SpotifyPlaylist[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const [query, setQuery] = useState('');

  const loggedIn = !!auth.accessToken;
  const premium = !!auth.premium;

  async function loadMore() {
    if (nextOffset === null) return;
    setLoading(true);
    const { items: page, nextOffset: nxt } = await spotifyFetchPlaylists(20, nextOffset || 0);
    setItems((prev) => [...prev, ...page]);
    setNextOffset(nxt);
    setLoading(false);
  }

  useEffect(() => {
    if (!loggedIn) {
      setItems([]);
      setNextOffset(0);
      return;
    }
    // Initial load
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const q = query.toLowerCase();
    return items.filter((p) => p.name.toLowerCase().includes(q));
  }, [items, query]);

  return (
    <div className="absolute left-2 top-16 w-[360px] bg-black/60 rounded p-3 pointer-events-auto space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm">Playlists</div>
        <div className="text-xs opacity-70">{loggedIn ? (premium ? 'Premium' : 'Free') : 'Logged out'}</div>
      </div>

      {!loggedIn ? (
        <button className="px-3 py-2 bg-green-700 rounded w-full" onClick={() => spotifyLogin()}>
          Login with Spotify
        </button>
      ) : (
        <>
          <input
            className="w-full bg-slate-900 rounded px-2 py-2 text-sm"
            placeholder="Search playlists..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />

          <div className="max-h-72 overflow-auto space-y-1 pr-1">
            {filtered.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-2 bg-slate-800/60 hover:bg-slate-700/60 rounded px-2 py-2 text-left"
                onClick={() => spotifyStartPlaylist(p.id)}
                title={p.name}
              >
                {p.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.image} alt="" className="w-8 h-8 rounded object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded bg-slate-700" />
                )}
                <div className="flex-1">
                  <div className="text-sm truncate">{p.name}</div>
                  <div className="text-[11px] opacity-70 truncate">
                    {p.owner ?? '—'} {typeof p.tracksTotal === 'number' ? `• ${p.tracksTotal} tracks` : ''}
                  </div>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="text-xs opacity-70 px-1 py-2">No playlists</div>
            )}
          </div>

          {nextOffset !== null && (
            <button
              className="px-3 py-2 bg-slate-800 rounded w-full disabled:opacity-60"
              onClick={loadMore}
              disabled={loading}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          )}
        </>
      )}
    </div>
  );
};