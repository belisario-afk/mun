import React, { useEffect } from 'react';
import { useStore } from '../../store/store';
import { fetchWeather } from '../../sensors/weather/openMeteo';
import { useGeolocation } from '../../sensors/geolocation/useGeolocation';

export const UpperBandEnv: React.FC = () => {
  const sensors = useStore((s) => s.sensors);
  const actions = useStore((s) => s.actions);
  const { status } = useGeolocation();

  useEffect(() => {
    if (status === 'granted') {
      fetchWeather().then((w) => actions.setWeather(w)).catch(() => {});
    }
  }, [status, actions]);

  return (
    <div
      className="absolute top-0 left-0 right-0 p-3 flex justify-between items-center bg-black/30 pointer-events-auto"
      aria-label="Vehicle and environment status"
    >
      <div className="flex items-center gap-4">
        <div aria-label="speed">Speed: {sensors.speedKmh.toFixed(0)} km/h</div>
        <div aria-label="heading">Heading: {sensors.headingDeg.toFixed(0)}°</div>
        {!sensors.gpsAvailable && (
          <div className="flex items-center gap-2">
            <label className="text-xs opacity-80" htmlFor="test-speed">Test Speed</label>
            <input
              id="test-speed"
              type="range"
              min={0}
              max={200}
              step={1}
              defaultValue={0}
              onChange={(e) => actions.setSpeed(Number(e.currentTarget.value))}
            />
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>Weather:</span>
        <span aria-live="polite">
          {sensors.weather ? `${sensors.weather.kind} ${sensors.weather.tempC ?? ''}°C` : '...'}
        </span>
      </div>
    </div>
  );
};