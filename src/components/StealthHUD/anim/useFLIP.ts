import { useCallback, useMemo, useRef, useState } from 'react';

// Lightweight FLIP for DOM nodes
export function useFLIP({ spring: _spring = 0.08, damping: _damping = 0.85 } = {}) {
  const nodeRef = useRef<HTMLElement | null>(null);
  const lastRect = useRef<DOMRect | null>(null);
  const [transform, setTransform] = useState<string>('translate3d(0,0,0)');

  const setNode = useCallback((el: HTMLElement | null) => {
    nodeRef.current = el;
  }, []);

  const measure = useCallback(() => {
    if (!nodeRef.current) return;
    lastRect.current = nodeRef.current.getBoundingClientRect();
  }, []);

  const play = useCallback(() => {
    const node = nodeRef.current;
    const prev = lastRect.current;
    if (!node || !prev) return;

    const next = node.getBoundingClientRect();
    const dx = prev.left - next.left;
    const dy = prev.top - next.top;
    const sx = prev.width / Math.max(1, next.width);
    const sy = prev.height / Math.max(1, next.height);

    node.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: 'none' }
      ],
      {
        duration: 420,
        easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)'
      }
    );
    setTransform('translate3d(0,0,0)');
  }, []);

  return useMemo(
    () => ({
      setNode,
      measure,
      play,
      transform
    }),
    [setNode, measure, play, transform]
  );
}