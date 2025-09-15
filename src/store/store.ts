import { create } from 'zustand';
import { themes } from '../theme/tokens';

export type Source = 'spotify' | 'radio' | 'local';
export type ScopeMode = 'oscilloscope' | 'equalizer' | 'ring' | 'timeline';

export interface UIState {
  scopeMode: ScopeMode;
  expanded: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  lowPower: boolean;
  toasts: { id: string; text: string; level: 'info' | 'warn' | 'error' }[];
}

export interface ThemeState {
  theme: keyof typeof themes;
}

export interface TabletState {
  wakeLock: boolean;
  fullscreen: boolean;
  carDockMode: boolean;
}

export interface AuthState {
  spotify: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    premium?: boolean;
    deviceId?: string;
  };
  providerReady: {
    spotify: boolean;
  };
}

export interface PlayerState {
  source: Source;
  playing: boolean;
  volume: number;
  track?: {
    id: string;
    title: string;
    artist: string;
    albumArt?: string;
  };
}

export interface AIState {
  enabled: boolean;
  provider: 'mini' | 'webllm' | 'openai' | 'azure' | 'gemini';
  active: boolean;
  log: { at: number; role: 'user' | 'assistant' | 'system'; text: string }[];
}

export interface SensorState {
  speedKmh: number;
  headingDeg: number;
  weather: { kind: 'sun' | 'rain' | 'fog' | 'cloud'; tempC?: number } | null;
  gpsAvailable: boolean;
}

export interface VoiceState {
  listening: boolean;
  ttsVoice?: string;
  ttsProvider: 'webspeech' | 'elevenlabs' | 'azure' | 'playht';
}

export type Store = {
  ui: UIState;
  theme: ThemeState;
  tablet: TabletState;
  auth: AuthState;
  player: PlayerState;
  ai: AIState;
  sensors: SensorState;
  voice: VoiceState;
  actions: {
    setSource: (s: Source) => void;
    setScopeMode: (m: ScopeMode) => void;
    toggleExpanded: (expanded?: boolean) => void;
    toast: (text: string, level?: 'info' | 'warn' | 'error') => void;
    clearToast: (id: string) => void;
    setSpeed: (v: number) => void;
    setHeading: (v: number) => void;
    setWeather: (w: SensorState['weather']) => void;
    setReducedMotion: (v: boolean) => void;
    setHighContrast: (v: boolean) => void;
    setLowPower: (v: boolean) => void;
    setPlayState: (playing: boolean) => void;
    setTrack: (t: PlayerState['track'] | null | undefined) => void;
    setAIViz: (enabled: boolean) => void;
    logAI: (role: 'user' | 'assistant' | 'system', text: string) => void;
    setListening: (v: boolean) => void;
    setWakeLock: (v: boolean) => void;
    setFullscreen: (v: boolean) => void;
    setCarDock: (v: boolean) => void;
    setTheme: (k: keyof typeof themes) => void;
  };
};

export const useStore = create<Store>((set, _get) => ({
  ui: {
    scopeMode: 'oscilloscope',
    expanded: true,
    reducedMotion: false,
    highContrast: false,
    lowPower: false,
    toasts: []
  },
  theme: {
    theme: 'spyTech'
  },
  tablet: { wakeLock: false, fullscreen: false, carDockMode: false },
  auth: { spotify: {}, providerReady: { spotify: false } },
  player: { source: 'radio', playing: false, volume: 0.7 },
  ai: { enabled: true, provider: (__AI_PROVIDER__ as any) || 'mini', active: false, log: [] },
  sensors: { speedKmh: 0, headingDeg: 0, weather: null, gpsAvailable: false },
  voice: { listening: false, ttsProvider: 'webspeech' },
  actions: {
    setSource: (s) => set((st) => ({ player: { ...st.player, source: s } })),
    setScopeMode: (m) => set((st) => ({ ui: { ...st.ui, scopeMode: m } })),
    toggleExpanded: (expanded) =>
      set((st) => ({ ui: { ...st.ui, expanded: expanded ?? !st.ui.expanded } })),
    toast: (text, level = 'info') =>
      set((st) => ({
        ui: {
          ...st.ui,
          toasts: [...st.ui.toasts, { id: Math.random().toString(36).slice(2), text, level }]
        }
      })),
    clearToast: (id) =>
      set((st) => ({ ui: { ...st.ui, toasts: st.ui.toasts.filter((t) => t.id !== id) } })),
    setSpeed: (v) => set((st) => ({ sensors: { ...st.sensors, speedKmh: v } })),
    setHeading: (v) => set((st) => ({ sensors: { ...st.sensors, headingDeg: v } })),
    setWeather: (w) => set((st) => ({ sensors: { ...st.sensors, weather: w } })),
    setReducedMotion: (v) => set((st) => ({ ui: { ...st.ui, reducedMotion: v } })),
    setHighContrast: (v) => set((st) => ({ ui: { ...st.ui, highContrast: v } })),
    setLowPower: (v) => set((st) => ({ ui: { ...st.ui, lowPower: v } })),
    setPlayState: (playing) => set((st) => ({ player: { ...st.player, playing } })),
    setTrack: (t) =>
      set((st) => {
        const player = { ...st.player };
        if (t) {
          player.track = t;
        } else {
          delete (player as any).track;
        }
        return { player };
      }),
    setAIViz: (enabled) => set((st) => ({ ai: { ...st.ai, enabled } })),
    logAI: (role, text) =>
      set((st) => ({ ai: { ...st.ai, log: [...st.ai.log, { at: Date.now(), role, text }] } })),
    setListening: (v) => set((st) => ({ voice: { ...st.voice, listening: v } })),
    setWakeLock: (v) => set((st) => ({ tablet: { ...st.tablet, wakeLock: v } })),
    setFullscreen: (v) => set((st) => ({ tablet: { ...st.tablet, fullscreen: v } })),
    setCarDock: (v) => set((st) => ({ tablet: { ...st.tablet, carDockMode: v } })),
    setTheme: (k) => set(() => ({ theme: { theme: k } }))
  }
}));