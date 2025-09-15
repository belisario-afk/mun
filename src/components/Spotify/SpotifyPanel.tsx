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
  const auth = useStore((s) => s.auth.spotify);
  const actions = useStore((s) => s.actions);
  const [devices, setDevices] = useState<{ id: string; name: string; is_active: boolean }[]>([]);
  const active = playerState.source === 'spotify';

  useEffect(() => {
    if (!active) return;
    initializeSpotifySDK().catch(() => {});
  }, [active]);

  useEffect(() => {
    async function run() {
      if (!active || !auth.accessToken) return;
      try {
        const player = await spotifyCreatePlayer();
        const list = await spotifyDevices();
        setDevices(list);
        if (player && auth.deviceId && list.every((d) => !d.is_active)) {
          await spotifyTransferPlayback(auth.deviceId);
        }
      } catch (_e) {
        actions.toast('Spotify init error', 'warn');
      }
    }
    run();
    const id = setInterval(run, 10000);
    return () => clearInterval(id);
  }, [active, auth.accessToken, auth.deviceId, actions]);

  if (!active) return null;

  const loggedIn = !!auth.accessToken;

  return (
    <div
      className="absolute left-2 bottom-20 w-[360px] bg-black/60 rounded p-3 pointer-events-auto"
      aria-label="Spotify controls"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm">Spotify</div>
        <div className="text-xs opacity-70">{loggedIn ? 'Connected' : 'Logged out'}</div>
      </div>
      {!loggedIn ? (
        <button className="px-3 py-2 bg-green-700 rounded w-full" onClick={() => spotifyLogin()}>
          Login with Spotify
        </button>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              className="px-3 py-2 bg-slate-800 rounded flex-1"
              onClick={() => spotifyPlayPause(!playerState.playing)}
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