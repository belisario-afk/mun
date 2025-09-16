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

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id,
  defaultPos = { x: 16, y: 120 },
  children,
  className = '',
  style,
  handleSelector
}) => {
  const ref = React.useRef<HTMLDivElement>(null);

  // Read initial position once
  const initialPos: Pos = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(storageKey(id));
      if (raw) return JSON.parse(raw) as Pos;
    } catch {}
    return defaultPos;
  }, [id, defaultPos]);

  const posRef = React.useRef<Pos>(initialPos);
  const [pos, setPos] = React.useState<Pos>(initialPos);

  const dragState = React.useRef<{ startX: number; startY: number; startPos: Pos; dragging: boolean }>({
    startX: 0,
    startY: 0,
    startPos: { x: 0, y: 0 },
    dragging: false
  });

  const onPointerDown = React.useCallback(
    (e: React.PointerEvent) => {
      const node = ref.current;
      if (!node) return;

      if (handleSelector) {
        const target = e.target as HTMLElement;
        if (target && !target.closest(handleSelector)) return;
      }

      e.preventDefault();
      (e.target as Element).setPointerCapture?.(e.pointerId);
      dragState.current.dragging = true;
      dragState.current.startX = e.clientX;
      dragState.current.startY = e.clientY;
      dragState.current.startPos = { ...posRef.current };
    },
    [handleSelector]
  );

  const onPointerMove = React.useCallback((e: React.PointerEvent) => {
    if (!dragState.current.dragging) return;

    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    const next: Pos = { x: dragState.current.startPos.x + dx, y: dragState.current.startPos.y + dy };

    // clamp to viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const node = ref.current;
    const rectW = node?.offsetWidth ?? 320;
    const rectH = node?.offsetHeight ?? 200;

    next.x = Math.max(8, Math.min(vw - rectW - 8, next.x));
    next.y = Math.max(8, Math.min(vh - rectH - 8, next.y));

    posRef.current = next;
    setPos(next);
  }, []);

  const endDrag = React.useCallback(() => {
    if (!dragState.current.dragging) return;
    dragState.current.dragging = false;
    try {
      localStorage.setItem(storageKey(id), JSON.stringify(posRef.current));
    } catch {}
  }, [id]);

  React.useEffect(() => {
    const up = () => endDrag();
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('blur', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
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
    >
      {children}
    </div>
  );
};