import { useStore } from '../../store/store';
import { generateCodeChallenge, generateCodeVerifier } from './pkce';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string;
const SCOPES =
  ((import.meta.env.VITE_SPOTIFY_SCOPES as string) ||
    'streaming user-read-playback-state user-modify-playback-state user-read-email') as string;

const ACCOUNTS = 'https://accounts.spotify.com';

export type SpotifyDevice = {
  id: string;
  is_active: boolean;
  is_private_session: boolean;
  is_restricted: boolean;
  name: string;
  type: string;
  volume_percent: number;
};

export async function initializeSpotifySDK() {
  const setReady = (v: boolean) =>
    useStore.setState((s) => ({
      auth: { ...s.auth, providerReady: { ...s.auth.providerReady, spotify: v } }
    }));
  if (window.Spotify) {
    setReady(true);
    return;
  }
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Spotify SDK load failed'));
    document.body.appendChild(script);
  });
  setReady(true);
}

export async function spotifyLogin() {
  const verifier = await generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);
  sessionStorage.setItem('sp_code_verifier', verifier);

  const url = new URL(`${ACCOUNTS}/authorize`);
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('redirect_uri', REDIRECT_URI);
  url.searchParams.set('code_challenge_method', 'S256');
  url.searchParams.set('code_challenge', challenge);
  url.searchParams.set('scope', SCOPES);
  location.assign(url.toString());
}

export async function spotifyHandleRedirect() {
  const params = new URL(location.href).searchParams;
  const code = params.get('code');
  if (!code) return false;
  const verifier = sessionStorage.getItem('sp_code_verifier')!;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code: code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    code_verifier: verifier
  });

  try {
    const res = await fetch(`${ACCOUNTS}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
    const json = await res.json();
    useStore.setState((s) => ({
      auth: {
        ...s.auth,
        spotify: {
          accessToken: json.access_token,
          refreshToken: json.refresh_token,
          expiresAt: Date.now() + json.expires_in * 1000
        }
      }
    }));
    history.replaceState({}, '', REDIRECT_URI);
    return true;
  } catch (e) {
    useStore.getState().actions.toast(
      'Spotify auth failed (possibly due to CORS). Configure a proxy per README.',
      'error',
    );
    console.warn(e);
    return false;
  }
}

export async function spotifyRefreshToken() {
  const st = useStore.getState().auth.spotify;
  if (!st.refreshToken) return;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: st.refreshToken!,
    client_id: CLIENT_ID
  });
  const res = await fetch(`${ACCOUNTS}/api/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body
  });
  if (!res.ok) throw new Error('Refresh failed');
  const json = await res.json();
  useStore.setState((s) => ({
    auth: {
      ...s.auth,
      spotify: {
        ...s.auth.spotify,
        accessToken: json.access_token,
        expiresAt: Date.now() + json.expires_in * 1000
      }
    }
  }));
}

export async function spotifyCreatePlayer() {
  const token = useStore.getState().auth.spotify.accessToken;
  if (!window.Spotify || !token) return null;
  return new Promise<any>((resolve, reject) => {
    const player = new window.Spotify.Player({
      name: 'Phantom Console',
      getOAuthToken: (cb: (token: string) => void) =>
        cb(useStore.getState().auth.spotify.accessToken!),
      volume: useStore.getState().player.volume
    });
    player.addListener('ready', ({ device_id }: any) => {
      useStore.setState((s) => ({
        auth: { ...s.auth, spotify: { ...s.auth.spotify, deviceId: device_id } }
      }));
      resolve(player);
    });
    player.addListener('initialization_error', reject);
    player.addListener('authentication_error', reject);
    player.addListener('account_error', reject);
    player.addListener('playback_error', (e: any) => console.warn('Playback error', e));
    player.connect();
  });
}

export async function spotifyTransferPlayback(deviceId: string) {
  const token = useStore.getState().auth.spotify.accessToken!;
  await fetch('https://api.spotify.com/v1/me/player', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_ids: [deviceId], play: true })
  });
}

export async function spotifyDevices(): Promise<SpotifyDevice[]> {
  const token = useStore.getState().auth.spotify.accessToken;
  if (!token) return [];
  const res = await fetch('https://api.spotify.com/v1/me/player/devices', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) return [];
  const json = await res.json();
  return json.devices || [];
}

export async function spotifyPlayPause(play: boolean) {
  const token = useStore.getState().auth.spotify.accessToken!;
  const endpoint = play ? 'play' : 'pause';
  const res = await fetch(`https://api.spotify.com/v1/me/player/${endpoint}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    useStore.getState().actions.toast('Spotify control failed', 'warn');
  } else {
    useStore.getState().actions.setPlayState(play);
  }
}

export async function spotifyNext() {
  const token = useStore.getState().auth.spotify.accessToken!;
  const res = await fetch(`https://api.spotify.com/v1/me/player/next`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) {
    useStore.getState().actions.toast('Next track failed', 'warn');
  }
}

export function spotifyLogout() {
  useStore.setState((s) => ({
    auth: { ...s.auth, spotify: {} }
  }));
  sessionStorage.removeItem('sp_code_verifier');
  useStore.getState().actions.toast('Logged out of Spotify');
}