import { useStore } from '../../store/store';

export async function fetchWeather() {
  // Use last known position from Geolocation API if available; otherwise fallback to 0,0
  const pos = await new Promise<GeolocationPosition | null>((resolve) =>
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(p),
      () => resolve(null),
      { maximumAge: 600000 },
    ),
  );
  const lat = pos?.coords.latitude ?? 0;
  const lon = pos?.coords.longitude ?? 0;
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', String(lat));
  url.searchParams.set('longitude', String(lon));
  url.searchParams.set('current_weather', 'true');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('weather failed');
  const json = await res.json();
  const code = json.current_weather?.weathercode ?? 0;
  const temp = json.current_weather?.temperature ?? 0;
  return {
    kind: toKind(code),
    tempC: temp
  } as const;
}

function toKind(code: number): 'sun' | 'rain' | 'fog' | 'cloud' {
  if ([0, 1].includes(code)) return 'sun';
  if ([45, 48].includes(code)) return 'fog';
  if ([51, 61, 63, 65, 80, 81, 82].includes(code)) return 'rain';
  return 'cloud';
}