import React, { useEffect } from 'react';
import { useStore } from '../store/store';

async function getDominantColor(url: string): Promise<string | undefined> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.referrerPolicy = 'no-referrer';
    const load = new Promise<HTMLImageElement>((res, rej) => {
      img.onload = () => res(img);
      img.onerror = (e) => rej(e);
      img.src = url;
    });
    const el = await load;
    const size = 16; // downsample for speed
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(el, 0, 0, size, size);
    const imgData = ctx.getImageData(0, 0, size, size);
    const data = imgData.data;
    let r = 0, g = 0, b = 0, n = 0;
    for (let i = 0; i + 3 < data.length; i += 4) {
      const a = data[i + 3]!;
      if (a < 8) continue;
      r += data[i + 0]!;
      g += data[i + 1]!;
      b += data[i + 2]!;
      n++;
    }
    if (!n) return;
    r = Math.round(r / n);
    g = Math.round(g / n);
    b = Math.round(b / n);
    // Slightly brighten and cool
    const boost = (v: number) => Math.min(255, Math.round(v * 1.05 + 8));
    const hex = `#${[boost(r), boost(g), boost(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    return hex;
  } catch {
    return;
  }
}

export const AlbumArtPaletteEffect: React.FC = () => {
  const albumArt = useStore((s) => s.player.track?.albumArt);
  const lowPower = useStore((s) => s.ui.lowPower);
  const setAccent = useStore((s) => s.actions.setAccentColor);

  useEffect(() => {
    if (!albumArt || lowPower) return;
    let alive = true;
    (async () => {
      const hex = await getDominantColor(albumArt);
      if (!alive) return;
      if (hex) {
        setAccent(hex);
        document.documentElement.style.setProperty('--accent', hex);
      }
    })();
    return () => {
      alive = false;
    };
  }, [albumArt, lowPower, setAccent]);

  useEffect(() => {
    // Ensure CSS var exists even without album art
    const accent = useStore.getState().theme.accent || '#58e7ff';
    document.documentElement.style.setProperty('--accent', accent);
  }, []);

  return null;
};