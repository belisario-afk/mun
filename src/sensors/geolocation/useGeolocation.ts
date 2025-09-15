import { useEffect, useState } from 'react';
import { useStore } from '../../store/store';

type Status = 'prompt' | 'granted' | 'denied';
export function useGeolocation(): { status: Status } {
  const [status, setStatus] = useState<Status>('prompt');
  const setSpeed = useStore((s) => s.actions.setSpeed);
  const setHeading = useStore((s) => s.actions.setHeading);
  const setGps = (v: boolean) => useStore.setState((s) => ({ sensors: { ...s.sensors, gpsAvailable: v } }));

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setStatus('denied');
      setGps(false);
      return;
    }
    const onSuccess = (() => {
      let last: GeolocationPosition | null = null;
      return (pos: GeolocationPosition) => {
        setStatus('granted');
        setGps(true);
        if (last) {
          const dt = (pos.timestamp - last.timestamp) / 1000;
          const dx = haversine(
            last.coords.latitude,
            last.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude,
          );
          const speedMs = dx / dt;
          const kmh = smooth(3, speedMs * 3.6);
          setSpeed(kmh);
          // Heading
          const hdg = bearing(
            last.coords.latitude,
            last.coords.longitude,
            pos.coords.latitude,
            pos.coords.longitude,
          );
          setHeading(hdg);
        }
        last = pos;
      };
    })();
    const onError = () => {
      setStatus('denied');
      setGps(false);
    };
    const id = navigator.geolocation.watchPosition(onSuccess, onError, {
      enableHighAccuracy: false,
      maximumAge: 3000,
      timeout: 10000
    });
    return () => {
      navigator.geolocation.clearWatch(id);
    };
  }, [setSpeed, setHeading]);

  return { status };
}

function smooth(n: number, value: number) {
  const key = '__pc_speed_smooth';
  const arr = (window as any)[key] || [];
  arr.push(value);
  if (arr.length > n) arr.shift();
  (window as any)[key] = arr;
  const avg = arr.reduce((a: number, b: number) => a + b, 0) / arr.length;
  return avg;
}

function toRad(d: number) {
  return (d * Math.PI) / 180;
}
function toDeg(r: number) {
  return (r * 180) / Math.PI;
}
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function bearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLon = toRad(lon2 - lon1);
  const y = Math.sin(dLon) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}