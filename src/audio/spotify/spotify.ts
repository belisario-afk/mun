/* Complete Spotify PKCE + Web Playback SDK wiring.
   - PKCE login with accounts.spotify.com
   - Token exchange + refresh + persistence (localStorage)
   - Session restore on app load
   - Web Playback SDK bootstrap
   - Devices list + transfer
   - Play/Pause/Next control with Web API
   - Fetch playlists, search, start a playlist context
*/

import { useStore } from '../../store/store';

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: any;
  }
}

type SpotifyTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // epoch ms
};

const STORAGE_KEY = 'spotify_auth_v1';
const STATE_KEY = 'spotify_pkce_state';
const VERIFIER_KEY = 'spotify_pkce_verifier';

const clientId: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID;
if (!clientId) {
  // Keep a dev hint without eslint disables
  console.warn('VITE_SPOTIFY_CLIENT_ID is not set. Spotify login will not work.');
}

// Respect Vite base so GH Pages /mun/ works. Default to current app base.
const BASE_URL = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '/') as string;
const defaultRedirect = `${location.origin}${BASE_URL}`;
// IMPORTANT: This must exactly match a Redirect URI configured in your Spotify app dashboard.
// Prefer setting VITE_SPOTIFY_REDIRECT_URI to avoid trailing-slash mismatches.
const redirectUri: string =
  import.meta.env.VITE_SPOTIFY_REDIRECT_URI?.trim() || defaultRedirect;

// Scopes required for SDK + control from Web API
const SCOPES =
  import.meta.env.VITE_SPOTIFY_SCOPES?.trim() ||
  [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'playlist-read-private',
    'playlist-read-collaborative'
  ].join(' ');

let sdkInjected = false;
let sdkReadyResolve: (() => void) | null = null;
const sdkReady = new Promise<void>((resolve) => {
  sdkReadyResolve = resolve;
});

function injectSpotifyScriptOnce() {
  if (sdkInjected) return;
  sdkInjected = true;

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

// Session persistence
function saveTokens(tokens: SpotifyTokens) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  useStore.setState((s) => {
    const nextSpotify: any = {
      ...s.auth.spotify,
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt
    };
    // Only assign refreshToken if present, to satisfy strict Store types
    if (tokens.refreshToken) nextSpotify.refreshToken = tokens.refreshToken;

    return {
      auth: {
        ...s.auth,
        spotify: nextSpotify
      }
    };
  });
}

function loadTokensFromStorage(): SpotifyTokens | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SpotifyTokens;
    if (!parsed.accessToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

function clearTokens() {
  localStorage.removeItem(STORAGE_KEY);
  useStore.setState((s) => ({ auth: { ...s.auth, spotify: {} } }));
}

function now() {
  return Date.now();
}

let refreshTimer: number | null = null;
function scheduleRefresh(expiresAt: number) {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  const ms = Math.max(5_000, expiresAt - now() - 60_000); // refresh 60s early
  refreshTimer = window.setTimeout(() => {
    refreshAccessToken().catch(() => {
      // silently ignore; calls will handle 401 with one retry
    });
  }, ms);
}

async function sha256(input: string) {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return new Uint8Array(hash);
}

function base64UrlEncode(bytes: Uint8Array) {
  let str = '';
  for (let i = 0; i < bytes.length; i++) {
    str += String.fromCharCode(bytes[i]!);
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString(len = 64) {
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

/**
 * Helpful for diagnostics and UI messaging.
 */
export function getSpotifyRedirectUri(): string {
  return redirectUri;
}

// PKCE login
export async function spotifyLogin() {
  if (!clientId) {
    useStore.getState().actions.toast('Spotify client id missing. Set VITE_SPOTIFY_CLIENT_ID.', 'error');
    return;
  }

  const state = randomString(16);
  const verifier = randomString(64);
  const challenge = base64UrlEncode(await sha256(verifier));

  sessionStorage.setItem(STATE_KEY, state);
  sessionStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
    state,
    scope: SCOPES,
    show_dialog: 'true'
  });

  location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function spotifyHandleRedirectCallback(): Promise<boolean> {
  const url = new URL(location.href);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    const known = String(error).toLowerCase();
    if (known.includes('invalid') || known.includes('client')) {
      // Surface exact redirect to configure in the Spotify Dashboard
      const alt =
        redirectUri.endsWith('/') ? redirectUri.slice(0, -1) : `${redirectUri}/`;
      useStore
        .getState()
        .actions.toast(
          `Spotify auth error: ${error}. Ensure Redirect URI matches exactly: ${redirectUri} (you may need to try ${alt} depending on trailing slash).`,
          'error'
        );
      console.warn(
        '[Spotify] Redirect URI mismatch. Configure this in your Spotify app:',
        redirectUri,
        'Alternate (if needed):',
        alt
      );
    } else {
      useStore.getState().actions.toast(`Spotify auth error: ${error}`, 'error');
    }
    // clean URL
    url.searchParams.delete('error');
    history.replaceState({}, '', url.toString());
    return false;
  }

  if (!code) {
    // Not an auth redirect: maybe restore tokens from storage
    const stored = loadTokensFromStorage();
    if (stored) {
      saveTokens(stored);
      scheduleRefresh(stored.expiresAt);
      // hydrate premium flag if we have it
      void fetchMeAndSetPremium().catch(() => {});
      return false;
    }
    return false;
  }

  const expectedState = sessionStorage.getItem(STATE_KEY);
  const verifier = sessionStorage.getItem(VERIFIER_KEY) || '';
  sessionStorage.removeItem(STATE_KEY);
  sessionStorage.removeItem(VERIFIER_KEY);

  if (!expectedState || state !== expectedState) {
    useStore.getState().actions.toast('Spotify auth state mismatch', 'error');
    return false;
  }

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
      code_verifier: verifier
    });

    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!res.ok) throw new Error(`token ${res.status}`);
    const j = await res.json();
    const tokens: SpotifyTokens = {
      accessToken: j.access_token,
      refreshToken: j.refresh_token,
      expiresAt: now() + (j.expires_in || 3600) * 1000
    };
    saveTokens(tokens);
    scheduleRefresh(tokens.expiresAt);
    await fetchMeAndSetPremium();

    useStore.getState().actions.toast('Spotify connected', 'info');

    // Clean the URL
    url.searchParams.delete('code');
    url.searchParams.delete('state');
    history.replaceState({}, '', url.toString());
    return true;
  } catch {
    useStore.getState().actions.toast('Spotify token exchange failed', 'error');
    return false;
  }
}

async function refreshAccessToken(): Promise<boolean> {
  const st = useStore.getState().auth.spotify;
  if (!st.refreshToken || !clientId) return false;

  try {
    const body = new URLSearchParams({
      client_id: clientId,
      grant_type: 'refresh_token',
      refresh_token: st.refreshToken
    });
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });
    if (!res.ok) throw new Error(`refresh ${res.status}`);
    const j = await res.json();
    const tokens: SpotifyTokens = {
      accessToken: j.access_token,
      // reuse old refresh token if new one not present
      refreshToken: j.refresh_token || st.refreshToken,
      expiresAt: now() + (j.expires_in || 3600) * 1000
    };
    saveTokens(tokens);
    scheduleRefresh(tokens.expiresAt);
    return true;
  } catch {
    return false;
  }
}

async function authorizedFetch(url: string, init?: RequestInit, retry = true) {
  const tok = useStore.getState().auth.spotify.accessToken;
  if (!tok) throw new Error('no access token');
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${tok}`,
      'Content-Type': 'application/json'
    }
  });

  if (res.status === 401 && retry) {
    const ok = await refreshAccessToken();
    if (ok) return authorizedFetch(url, init, false);
  }
  return res;
}

async function fetchMeAndSetPremium() {
  try {
    const res = await authorizedFetch('https://api.spotify.com/v1/me');
    if (!res.ok) return;
    const j = await res.json();
    const premium = String(j.product || '').toLowerCase() === 'premium';
    useStore.setState((s) => ({ auth: { ...s.auth, spotify: { ...s.auth.spotify, premium } } }));
  } catch {
    // ignore
  }
}

// Web Playback SDK player
let playerRef: any | null = null;

export async function spotifyCreatePlayer() {
  await initializeSpotifySDK();

  const token = useStore.getState().auth.spotify.accessToken;
  if (!window.Spotify || !token) return null;

  if (playerRef) return playerRef;

  const player = new window.Spotify.Player({
    name: 'Phantom Console',
    getOAuthToken: (cb: (t: string) => void) => cb(token),
    volume: useStore.getState().player.volume
  });

  player.addListener('ready', ({ device_id }: any) => {
    useStore.setState((s) => ({
      auth: { ...s.auth, spotify: { ...s.auth.spotify, deviceId: device_id } }
    }));
    useStore.getState().actions.toast('Spotify device ready', 'info');
  });
  player.addListener('not_ready', () => {
    // device offline
  });
  player.addListener('player_state_changed', (state: any) => {
    if (!state) return;
    useStore.getState().actions.setPlayState(!state.paused);
    const t = state.track_window?.current_track;
    if (t) {
      useStore.getState().actions.setTrack({
        id: t.id,
        title: t.name,
        artist: t.artists?.map((a: any) => a.name).join(', ') || '',
        albumArt: t.album?.images?.[0]?.url
      });
    }
  });

  await player.connect();
  playerRef = player;
  return player;
}

// Devices and playback control
export async function spotifyDevices(): Promise<{ id: string; name: string; is_active: boolean }[]> {
  try {
    const res = await authorizedFetch('https://api.spotify.com/v1/me/player/devices');
    if (!res.ok) return [];
    const j = await res.json();
    return (j.devices || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      is_active: !!d.is_active
    }));
  } catch {
    return [];
  }
}

export async function spotifyTransferPlayback(deviceId: string) {
  try {
    const res = await authorizedFetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      body: JSON.stringify({ device_ids: [deviceId], play: false })
    });
    if (!res.ok) throw new Error(`transfer ${res.status}`);
    useStore.setState((s) => ({
      auth: { ...s.auth, spotify: { ...s.auth.spotify, deviceId } }
    }));
  } catch {
    useStore.getState().actions.toast('Transfer playback failed', 'warn');
  }
}

export async function spotifyPlayPause(play: boolean) {
  try {
    const endpoint = play
      ? 'https://api.spotify.com/v1/me/player/play'
      : 'https://api.spotify.com/v1/me/player/pause';
    const res = await authorizedFetch(endpoint, { method: 'PUT', body: JSON.stringify({}) });
    if (!res.ok) throw new Error(`playpause ${res.status}`);
    useStore.getState().actions.setPlayState(play);
  } catch {
    useStore.getState().actions.toast('Play/Pause failed', 'warn');
  }
}

export async function spotifyNext() {
  try {
    const res = await authorizedFetch('https://api.spotify.com/v1/me/player/next', {
      method: 'POST',
      body: JSON.stringify({})
    });
    if (!res.ok) throw new Error(`next ${res.status}`);
  } catch {
    useStore.getState().actions.toast('Next failed', 'warn');
  }
}

export async function spotifyLogout() {
  clearTokens();
  useStore.getState().actions.toast('Spotify logout', 'info');
}

// Helper to run on app start: restore tokens and handle redirect if present
export async function spotifyInitOnAppLoad() {
  // 1) Handle redirect exchange if code present
  const didAuth = await spotifyHandleRedirectCallback();

  // 2) If no code, restore tokens
  if (!didAuth) {
    const stored = loadTokensFromStorage();
    if (stored) {
      saveTokens(stored);
      scheduleRefresh(stored.expiresAt);
      void fetchMeAndSetPremium().catch(() => {});
    }
  }

  // 3) Inject SDK early
  void initializeSpotifySDK();
}

/* -------- Playlists, search, and ensure device helpers -------- */

export type SpotifyPlaylist = {
  id: string;
  name: string;
  image?: string;
  owner?: string;
  tracksTotal?: number;
};

export async function spotifyFetchPlaylists(limit = 20, offset = 0): Promise<{ items: SpotifyPlaylist[]; nextOffset: number | null }> {
  try {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const res = await authorizedFetch(`https://api.spotify.com/v1/me/playlists?${params.toString()}`);
    if (!res.ok) throw new Error(`playlists ${res.status}`);
    const j = await res.json();
    const items: SpotifyPlaylist[] = (j.items || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      image: p.images?.[0]?.url,
      owner: p.owner?.display_name,
      tracksTotal: p.tracks?.total
    }));
    const nextOffset = j.next ? offset + limit : null;
    return { items, nextOffset };
  } catch {
    useStore.getState().actions.toast('Failed to fetch playlists', 'warn');
    return { items: [], nextOffset: null };
  }
}

export type SpotifySearchResult = {
  tracks: { id: string; name: string; artist: string; albumArt?: string }[];
};

export async function spotifySearchTracks(query: string, limit = 10): Promise<SpotifySearchResult> {
  try {
    const params = new URLSearchParams({ q: query, type: 'track', limit: String(limit) });
    const res = await authorizedFetch(`https://api.spotify.com/v1/search?${params.toString()}`);
    if (!res.ok) throw new Error(`search ${res.status}`);
    const j = await res.json();
    const tracks = (j.tracks?.items || []).map((t: any) => ({
      id: t.id,
      name: t.name,
      artist: t.artists?.map((a: any) => a.name).join(', ') || '',
      albumArt: t.album?.images?.[0]?.url
    }));
    return { tracks };
  } catch {
    return { tracks: [] };
  }
}

async function ensureBrowserDeviceActive(): Promise<string | null> {
  await spotifyCreatePlayer();
  const auth = useStore.getState().auth.spotify;
  const devices = await spotifyDevices();
  // Prefer our own connected device if present
  if (auth.deviceId && devices.find((d) => d.id === auth.deviceId)) {
    return auth.deviceId;
  }
  // Otherwise choose the first active device; if browser device is present but not active, transfer
  const active = devices.find((d) => d.is_active)?.id || devices[0]?.id || null;
  if (active && active !== auth.deviceId) {
    await spotifyTransferPlayback(active);
    return active;
  }
  return auth.deviceId || active;
}

export async function spotifyStartPlaylist(playlistId: string) {
  const st = useStore.getState();
  if (!st.auth.spotify.accessToken) {
    useStore.getState().actions.toast('Connect Spotify first', 'warn');
    return;
  }

  if (!st.auth.spotify.premium) {
    useStore.getState().actions.toast('Spotify Premium is required for in-browser playback', 'warn');
    return;
  }

  try {
    st.actions.setSource('spotify');
    const device = await ensureBrowserDeviceActive();

    const params = device ? `?device_id=${encodeURIComponent(device)}` : '';
    const res = await authorizedFetch(`https://api.spotify.com/v1/me/player/play${params}`, {
      method: 'PUT',
      body: JSON.stringify({
        context_uri: `spotify:playlist:${playlistId}`,
        offset: { position: 0 }
      })
    });
    if (!res.ok) throw new Error(`play ${res.status}`);
  } catch {
    useStore.getState().actions.toast('Failed to start playlist', 'error');
  }
}