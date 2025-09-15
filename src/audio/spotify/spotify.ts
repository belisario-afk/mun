/* Minimal Spotify Web Playback SDK bootstrap that defines the global callback BEFORE the script loads,
   fixing "onSpotifyWebPlaybackSDKReady is not defined" errors. */

import { useStore } from '../../store/store';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

let sdkInjected = false;
let sdkReadyResolve: (() => void) | null = null;
const sdkReady = new Promise<void>((resolve) => {
  sdkReadyResolve = resolve;
});

function injectSpotifyScriptOnce() {
  if (sdkInjected) return;
  sdkInjected = true;

  // Define global callback BEFORE loading the script
  window.onSpotifyWebPlaybackSDKReady = () => {
    sdkReadyResolve?.();
  };

  const tag = document.createElement('script');
  tag.src = 'https://sdk.scdn.co/spotify-player.js';
  tag.async = true;
  tag.crossOrigin = 'anonymous';
  document.head.appendChild(tag);
}

export async function initializeSpotifySDK() {
  injectSpotifyScriptOnce();
  await sdkReady;
}

export async function spotifyLogin() {
  // Your existing PKCE/implicit grant flow; placeholder toast for now
  useStore.getState().actions.toast('Spotify login not wired for demo', 'warn');
}

export async function spotifyLogout() {
  useStore.setState((s) => ({
    auth: { ...s.auth, spotify: {} }
  }));
  useStore.getState().actions.toast('Spotify logout', 'info');
}

export async function spotifyCreatePlayer() {
  await initializeSpotifySDK();
  if (!window.Spotify) return null;

  const token = useStore.getState().auth.spotify.accessToken;
  if (!token) return null;

  const player = new window.Spotify.Player({
    name: 'Phantom Console',
    getOAuthToken: (cb: (token: string) => void) => cb(token),
    volume: useStore.getState().player.volume
  });

  player.addListener('ready', ({ device_id }: any) => {
    useStore.setState((s) => ({
      auth: { ...s.auth, spotify: { ...s.auth.spotify, deviceId: device_id } }
    }));
  });

  player.addListener('not_ready', () => {
    // device went offline
  });

  await player.connect();
  return player;
}

// Stubs for device management in demo
export async function spotifyDevices(): Promise<{ id: string; name: string; is_active: boolean }[]> {
  return [];
}

export async function spotifyTransferPlayback(_deviceId: string) {
  // call Spotify Web API transfer playback here
}

export async function spotifyPlayPause(_play: boolean) {
  // call Spotify Web API start/pause here
}

export async function spotifyNext() {
  // call Spotify Web API next track here
}