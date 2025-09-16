import React, { useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { CentralScope } from '../components/CentralScope/CentralScope';
import { LeftWingPlaylists } from '../components/LeftWingPlaylists/LeftWingPlaylists';
import { RightWingComms } from '../components/RightWingComms/RightWingComms';
import { UpperBandEnv } from '../components/UpperBandEnv/UpperBandEnv';
import { StealthMenu } from '../components/StealthMenu/StealthMenu';
import { TogglePaddles } from '../components/TogglePaddles/TogglePaddles';
import { useStore } from '../store/store';
import { useWakeLock } from '../tablet/WakeLock';
import { useFullscreen } from '../tablet/Fullscreen';
import { GestureLayer } from '../tablet/Gestures';
import { Diagnostics } from '../components/UI/Diagnostics';
import { initializeSpotifySDK, spotifyInitOnAppLoad } from '../audio/spotify/spotify';
import { VoiceIndicator } from '../components/UI/VoiceIndicator';
import { A11yAnnouncer } from '../accessibility/A11yAnnouncer';
import { Toasts } from '../components/UI/Toasts';
import { FirstRunHint } from '../components/UI/FirstRunHint';
import { SpotifyPanel } from '../components/Spotify/SpotifyPanel';
import { LocalPanel } from '../components/Local/LocalPanel';
import { CarDockManager } from '../tablet/CarDock';
import { InstallPrompt } from '../components/UI/InstallPrompt';
import { DynamicDPR } from '../three/perf/DynamicDPR';
import { startAmbient } from '../audio/ambient/ambient';
import { SourceController } from '../audio/SourceController';
import { initGeolocationOnGesture } from '../sensors/geolocation/useGeolocation';
import { waitForFirstGesture } from '../utils/userGesture';
import { useWeather } from '../sensors/weather/useWeather';

export const App: React.FC = () => {
  const {
    ui: { reducedMotion, highContrast }
  } = useStore();

  useWakeLock();
  useFullscreen();
  useWeather();

  useEffect(() => {
    spotifyInitOnAppLoad().catch(() => {});
    initializeSpotifySDK().catch(() => {});
    initGeolocationOnGesture();

    (async () => {
      await waitForFirstGesture();
      startAmbient();
    })();
  }, []);

  return (
    <div
      className={[
        'w-full h-full overflow-hidden text-white select-none',
        reducedMotion ? 'prefers-reduced-motion' : '',
        highContrast ? 'high-contrast' : ''
      ].join(' ')}
      aria-label="Phantom Console Stealth Cockpit Stereo"
    >
      <A11yAnnouncer />
      <GestureLayer />
      <SourceController />
      <CarDockManager />

      <div className="absolute inset-0">
        <Canvas dpr={[0.7, 1.0]} frameloop="always" onCreated={({ gl }) => gl.setClearColor(0x0b1016)}>
          <CentralScope />
          <DynamicDPR />
        </Canvas>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <UpperBandEnv />
        <LeftWingPlaylists />
        <RightWingComms />
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto">
        <TogglePaddles />
      </div>

      <StealthMenu />
      <VoiceIndicator />
      <Diagnostics />
      <Toasts />
      <FirstRunHint />
      <InstallPrompt />

      <SpotifyPanel />
      <LocalPanel />
    </div>
  );
};