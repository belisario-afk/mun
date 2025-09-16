import React from 'react';

type DraggablePanelProps = {
  id: string;
  defaultPos?: { x: number; y: number };
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  handleSelector?: string; // optional querySelector within children to use as handle
};

type Pos = { x: number; y: number };

const storageKey = (id: string) => `draggable:${id}:pos`;

function loadInitialPos(id: string, fallback: Pos): Pos {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (raw) {
      const p = JSON.parse(raw) as Partial<Pos>;
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        return { x: p.x, y: p.y };
      }
    }
  } catch {
    // ignore
  }
  return fallback;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  defaultPos = { x: 16, y: 120 },
  children,
  className = '',
  style,
  handleSelector
}) => {
  // Lazily init position from localStorage
  const [pos, setPos] = React.useState<Pos>(() => loadInitialPos(id, defaultPos));

  // Keep a ref in sync for fast reads during pointermove
  const posRef = React.useRef<Pos>(pos);
  React.useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  const ref = React.useRef<HTMLDivElement>(null);
  const dragState = React.useRef<{ startX: number; startY: number; startPos: Pos; dragging: boolean }>({
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
    dragging: false
  });

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const node = ref.current;
      if (!node) return;

      if (handleSelector) {
        const target = e.target as Element | null;
        if (target && !target.closest(handleSelector)) return;
      }

      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragState.current.dragging = true;
      dragState.current.startX = e.clientX;
      dragState.current.startY = e.clientY;
      dragState.current.startPos = { ...posRef.current };
    },
    [handleSelector]
  );

  const onPointerMove = React.useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current.dragging) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next: Pos = {
      x: dragState.current.startPos.x + dx,
      y: dragState.current.startPos.y + dy
    };

    // Clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const node = ref.current;
    const rectW = node?.offsetWidth ?? 320;
    const rectH = node?.offsetHeight ?? 200;

    next.x = Math.max(8, Math.min(vw - rectW - 8, next.x));
    next.y = Math.max(8, Math.min(vh - rectH - 8, next.y));

    setPos(next);
  }, []);

  const endDrag = React.useCallback(() => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    try {
      localStorage.setItem(storageKey(id), JSON.stringify(posRef.current));
    } catch {
      // ignore
    }
  }, [id]);

  React.useEffect(() => {
    const up = () => endDrag();
    window.addEventListener('pointerup', up);
    window.addEventListener('blur', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('blur', up);
    };
  }, [endDrag]);

  return (
    <div
      ref={ref}
      className={`absolute pointer-events-auto select-none ${className}`}
      style={{ left: pos.x, top: pos.y, ...style }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      role="region"
      aria-roledescription="draggable panel"
      aria-label={id}
    >
      {children}
    </div>
  );
};