import React, { useEffect, useMemo, useState } from 'react';
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
import { VisualEffects } from '../three/fx/VisualEffects';
import { ScopeParticles } from '../components/Scope/ScopeParticles';
import { ScopeArcs } from '../components/Scope/ScopeArcs';
import { WeatherLayerFX } from '../components/FX/WeatherLayerFX';
import { IrisMask } from '../components/Overlays/IrisMask';
import { BootSequence } from '../components/Overlays/BootSequence';
import { AlbumArtPaletteEffect } from '../theme/AlbumArtPaletteEffect';

export const App: React.FC = () => {
  const {
    ui: { reducedMotion, highContrast, expanded, parallax },
  } = useStore();

  useWakeLock();
  useFullscreen();
  useWeather();

  // Parallax tracking (CSS-based for overlay layers)
  const [px, setPx] = useState({ x: 0.5, y: 0.5 });
  const onMouseMove = (e: React.MouseEvent) => {
    if (!parallax || reducedMotion) return;
    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setPx({ x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) });
  };
  const overlayTransform = useMemo(() => {
    if (!parallax || reducedMotion) return undefined;
    const dx = (px.x - 0.5) * 12; // px offset
    const dy = (px.y - 0.5) * 8;
    return `translate3d(${dx}px, ${dy}px, 0)`;
  }, [px, parallax, reducedMotion]);

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
      onMouseMove={onMouseMove}
    >
      <A11yAnnouncer />
      <GestureLayer />
      <SourceController />
      <CarDockManager />

      <AlbumArtPaletteEffect />

      {/* Boot sequence overlay */}
      <BootSequence />

      {/* Iris mask transition on expand/stealth */}
      <IrisMask />

      <div className="absolute inset-0">
        <Canvas dpr={[0.7, 1.0]} frameloop="always" onCreated={({ gl }) => gl.setClearColor(0x0b1016)}>
          <CentralScope />
          <ScopeArcs />
          <ScopeParticles />
          <WeatherLayerFX />
          <VisualEffects />
          <DynamicDPR />
        </Canvas>
      </div>

      {expanded && (
        <div
          className="absolute inset-0 pointer-events-none will-change-transform"
          style={overlayTransform ? { transform: overlayTransform } : undefined}
        >
          <UpperBandEnv />
          <LeftWingPlaylists />
          <RightWingComms />
        </div>
      )}

      {expanded && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-auto will-change-transform"
          style={overlayTransform ? { transform: overlayTransform } : undefined}
        >
          <TogglePaddles />
        </div>
      )}

      <StealthMenu />
      <VoiceIndicator />
      <Diagnostics />
      <Toasts />
      <FirstRunHint />
      <InstallPrompt />

      {expanded && <SpotifyPanel />}
      {expanded && <LocalPanel />}
    </div>
  );
};