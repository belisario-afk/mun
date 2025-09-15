import React from 'react';
import { useStore } from '../../store/store';
import { useGeolocation } from '../../sensors/geolocation/useGeolocation';

export const UpperBandEnv: React.FC = () => {
  // Arm geolocation request on first user gesture; no return value needed
  useGeolocation();

  const { speedKmh, headingDeg, weather, gpsAvailable } = useStore((s) => s.sensors);

  return (
    <div className="absolute top-2 left-2 text-xs space-y-1 pointer-events-none">
      <div>Speed: {Math.round(speedKmh)} km/h</div>
      <div>Heading: {Math.round(headingDeg)}°</div>
      <div>
        Weather: {weather?.kind ?? 'n/a'} {typeof weather?.tempC === 'number' ? `${Math.round(weather!.tempC)}°C` : ''}
      </div>
      <div>GPS: {gpsAvailable ? 'on' : 'off'}</div>
    </div>
  );
}