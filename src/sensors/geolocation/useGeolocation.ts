import { useEffect } from 'react';
import { useStore } from '../../store/store';

// Only request geolocation in response to a user gesture to avoid browser violations.
let armed = false;

/**
 * One-time arming that requests geolocation on the user's first gesture.
 * Safe to call multiple times; it only attaches once.
 */
export function initGeolocationOnGesture() {
  if (armed) return;
  armed = true;

  const request = () => {
    const setSpeed = useStore.getState().actions.setSpeed;
    const setHeading = useStore.getState().actions.setHeading;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        // mark GPS available
        useStore.setState((s) => ({ sensors: { ...s.sensors, gpsAvailable: true } }));

        const s = pos.coords.speed;
        if (typeof s === 'number' && Number.isFinite(s)) {
          setSpeed(Math.max(0, s * 3.6)); // m/s -> km/h
        }
        const h = pos.coords.heading;
        if (typeof h === 'number' && Number.isFinite(h)) {
          setHeading(h);
        }
      },
      () => {
        // mark GPS unavailable; user may deny
        useStore.setState((s) => ({ sensors: { ...s.sensors, gpsAvailable: false } }));
      },
      { maximumAge: 600000 }
    );
  };

  // One-time listeners; they remove themselves via { once: true }
  window.addEventListener('pointerdown', request, { once: true });
  window.addEventListener('keydown', request, { once: true });
}

/**
 * React hook shim to maintain backward compatibility with components that import useGeolocation.
 * Internally just arms the one-time geolocation request on first user gesture.
 */
export function useGeolocation() {
  useEffect(() => {
    initGeolocationOnGesture();
  }, []);
}