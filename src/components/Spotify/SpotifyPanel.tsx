import React, { useEffect, useState } from 'react';
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

export const SpotifyPanel: React.FC = () => {
  const playerState = useStore((s) => s.player);
  const actions = useStore((s) => s.actions);
  const auth = useStore((s) => s.auth.spotify);
  const [devices, setDevices] = useState<{ id: string; name: string; is_active: boolean }[]>([]);
  const active = playerState.source === 'spotify';

  const loggedIn = !!auth.accessToken;
  const premium = !!auth.premium;

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

  if (!active) return null;

  return (
    <div
      className="absolute left-2 bottom-20 w-[360px] bg-black/60 rounded p-3 pointer-events-auto"
      aria-label="Spotify controls"
    >
      <div className="flex items-center justify-between mb-2">
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
        <div className="space-y-2">
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
            <button className="px-3 py-2 bg-slate-800 rounded" onClick={() => spotifyLogout()}>
              Logout
            </button>
          </div>
          <div>
            <label className="text-xs opacity-80">Device</label>
            <select
              className="mt-1 w-full bg-slate-900 rounded px-2 py-2"
              onChange={(e) => e.target.value && spotifyTransferPlayback(e.target.value)}
              value={auth.deviceId || (devices.find((d) => d.is_active)?.id ?? '')}
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
          </div>
        </div>
      )}
    </div>
  );
};