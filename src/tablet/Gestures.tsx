import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/store';

export const GestureLayer: React.FC = () => {
  const actions = useStore((s) => s.actions);
  const scopeMode = useStore((s) => s.ui.scopeMode);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = document.body;

    let tracking = false;
    const touches: Map<number, { x: number; y: number }> = new Map();
    let startDist = 0;
    let startAngle = 0;
    let lastGestureTime = 0;

    function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      return Math.hypot(dx, dy);
    }
    function angle(a: { x: number; y: number }, b: { x: number; y: number }) {
      return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
    }

    const onTouchStart = (e: TouchEvent) => {
      if (e.target && (e.target as HTMLElement).closest('input,button,textarea')) return;
      for (const t of Array.from(e.changedTouches)) {
        touches.set(t.identifier, { x: t.clientX, y: t.clientY });
      }
      if (touches.size === 2) {
        e.preventDefault();
        tracking = true;
        const [a, b] = Array.from(touches.values());
        if (!a || !b) return;
        startDist = distance(a, b);
        startAngle = angle(a, b);
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!tracking) return;
      for (const t of Array.from(e.changedTouches)) {
        if (touches.has(t.identifier)) {
          touches.set(t.identifier, { x: t.clientX, y: t.clientY });
        }
      }
      if (touches.size === 2) {
        const [a, b] = Array.from(touches.values());
        if (!a || !b) return;
        const dist = distance(a, b);
        const ang = angle(a, b);
        const scale = dist / startDist;
        const rot = ang - startAngle;

        const now = performance.now();
        if (Math.abs(rot) > 20 && now - lastGestureTime > 400) {
          lastGestureTime = now;
          const modes: any[] = ['oscilloscope', 'equalizer', 'ring', 'timeline'];
          const idx = modes.indexOf(scopeMode);
          const next = modes[(idx + (rot > 0 ? 1 : modes.length - 1)) % modes.length];
          actions.setScopeMode(next as any);
          actions.toast(`Scope mode: ${next}`);
        } else if (Math.abs(scale - 1) > 0.15 && now - lastGestureTime > 300) {
          lastGestureTime = now;
          actions.toggleExpanded(scale > 1);
          actions.toast(scale > 1 ? 'Expanded cockpit' : 'Stealth HUD');
        }
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      for (const t of Array.from(e.changedTouches)) {
        touches.delete(t.identifier);
      }
      if (touches.size < 2) {
        tracking = false;
      }
    };

    let startY = 0;
    let startX = 0;
    let swipeActive = false;

    const onPointerDown = (e: PointerEvent) => {
      startY = e.clientY;
      startX = e.clientX;
      swipeActive = true;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!swipeActive) return;
      const dy = startY - e.clientY;
      const dx = Math.abs(e.clientX - startX);
      if (dy > 64 && dx < 24) {
        swipeActive = false;
        const btn = document.querySelector('[aria-label="Open menu"]') as HTMLButtonElement | null;
        btn?.click();
      }
    };
    const onPointerUp = () => (swipeActive = false);

    el.addEventListener('touchstart', onTouchStart, { passive: false });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    el.addEventListener('pointerdown', onPointerDown);
    el.addEventListener('pointermove', onPointerMove);
    el.addEventListener('pointerup', onPointerUp);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('pointerdown', onPointerDown);
      el.removeEventListener('pointermove', onPointerMove);
      el.removeEventListener('pointerup', onPointerUp);
    };
  }, [actions, scopeMode]);

  return <div ref={ref} className="sr-only" aria-hidden />;
};