import React from 'react';
import { useStore } from '../../store/store';

type Telemetry = {
  speedKmh: number | null;
  speedMph: number | null;
  headingDeg: number | null;
  lat: number | null;
  lon: number | null;
  accuracy: number | null;
};

function useLiveTelemetry() {
  const [t, setT] = React.useState<Telemetry>({
    speedKmh: null,
    speedMph: null,
    headingDeg: null,
    lat: null,
    lon: null,
    accuracy: null
  });

  React.useEffect(() => {
    if (!('geolocation' in navigator)) return;
    let last: { lat: number; lon: number; t: number } | null = null;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, heading, speed, accuracy } = pos.coords;
        const now = pos.timestamp || performance.now();

        let speedMs: number | null = speed ?? null;
        // Compute speed if not provided by platform
        if (speedMs == null && last) {
          const toRad = (x: number) => (x * Math.PI) / 180;
          const R = 6371000;
          const dLat = toRad(latitude - last.lat);
          const dLon = toRad(longitude - last.lon);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(last.lat)) * Math.cos(toRad(latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          const d = R * c;
          const dt = Math.max(1, (now - last.t) / 1000);
          speedMs = d / dt;
        }

        setT({
          speedKmh: speedMs != null ? speedMs * 3.6 : null,
          speedMph: speedMs != null ? speedMs * 2.23693629 : null,
          headingDeg: heading ?? null,
          lat: latitude ?? null,
          lon: longitude ?? null,
          accuracy: accuracy ?? null
        });

        last = { lat: latitude, lon: longitude, t: now };
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  return t;
}

export const TelemetryHUD: React.FC = () => {
  // Weather from store if available; optional chaining with any to avoid strict TS coupling
  const weather = useStore((s: any) => s.weather ?? s.sensors?.weather ?? null);
  const t = useLiveTelemetry();

  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 flex gap-3 items-center bg-black/45 px-3 py-2 rounded pointer-events-auto">
      <Badge label="Speed" value={formatSpeed(t.speedKmh, t.speedMph)} />
      <Badge label="Heading" value={formatHeading(t.headingDeg)} />
      <Badge label="GPS" value={formatGps(t.lat, t.lon, t.accuracy)} />
      <Badge label="Weather" value={formatWeather(weather)} />
    </div>
  );
};

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-xs">
      <div className="opacity-60">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}

function formatSpeed(kmh: number | null, mph: number | null) {
  if (kmh == null || mph == null) return '—';
  return `${Math.round(kmh)} km/h · ${Math.round(mph)} mph`;
}

function formatHeading(deg: number | null) {
  if (deg == null || Number.isNaN(deg)) return '—';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW', 'N'];
  const idx = Math.round(deg / 45);
  return `${Math.round(deg)}° ${dirs[idx]}`;
}

function formatGps(lat: number | null, lon: number | null, acc: number | null) {
  if (lat == null || lon == null) return '—';
  const latStr = lat.toFixed(5);
  const lonStr = lon.toFixed(5);
  const accStr = acc != null ? ` ±${Math.round(acc)}m` : '';
  return `${latStr}, ${lonStr}${accStr}`;
}

function formatWeather(w: any) {
  if (!w) return '—';
  const temp = w.temp ?? w.temperature ?? w.current?.temp ?? w.current?.temperature;
  const cond = w.desc ?? w.description ?? w.current?.conditions ?? w.current?.summary;
  const tStr = temp != null ? `${Math.round(temp)}°` : '';
  return [tStr, cond].filter(Boolean).join(' ');
}