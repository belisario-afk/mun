import { useEffect } from 'react';
import { useStore } from '../../store/store';

// Map Open-Meteo WMO codes to app's union: 'sun' | 'cloud' | 'rain' | 'fog'
function weatherKindFromCode(code: number): 'sun' | 'cloud' | 'rain' | 'fog' {
  if (code === 0) return 'sun';
  if ([1, 2, 3].includes(code)) return 'cloud';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code)) return 'rain';
  return 'cloud';
}

async function fetchWeather(lat: number, lon: number) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current: 'temperature_2m,weather_code'
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const j = await res.json();

  const tempRaw: unknown = j.current?.temperature_2m;
  const codeRaw: unknown = j.current?.weather_code;

  const tempC = typeof tempRaw === 'number' && Number.isFinite(tempRaw) ? tempRaw : 0; // Store expects number
  const kind = typeof codeRaw === 'number' ? weatherKindFromCode(codeRaw) : 'cloud';

  useStore.setState((s) => ({
    sensors: { ...s.sensors, weather: { kind, tempC } }
  }));
}

/**
 * Fetch weather periodically using geolocation directly.
 */
export function useWeather() {
  useEffect(() => {
    let cancelled = false;

    async function pollOnce() {
      if (!('geolocation' in navigator)) return;
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          if (cancelled) return;
          try {
            await fetchWeather(pos.coords.latitude, pos.coords.longitude);
          } catch {
            // ignore
          }
        },
        () => {
          // ignore denial
        },
        { maximumAge: 10 * 60 * 1000, enableHighAccuracy: true }
      );
    }

    void pollOnce();
    const id = setInterval(pollOnce, 15 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);
}