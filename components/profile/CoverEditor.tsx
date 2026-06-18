"use client";

import { useRef, useState } from "react";

/**
 * Facebook-style cover with drag-to-reposition. Dragging the image up/down
 * sets the vertical focal point (0–100%), reported back via onPosChange.
 */
export default function CoverEditor({
  coverUrl,
  pos,
  onPosChange,
}: {
  coverUrl: string;
  pos: number;
  onPosChange: (p: number) => void;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startY: number; startPos: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  function clamp(n: number) {
    return Math.max(0, Math.min(100, n));
  }

  function onPointerDown(e: React.PointerEvent) {
    if (!coverUrl) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, startPos: pos };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !frameRef.current) return;
    const h = frameRef.current.offsetHeight || 1;
    const dy = e.clientY - drag.current.startY;
    // Dragging down reveals the top of the image (position decreases).
    onPosChange(clamp(drag.current.startPos - (dy / h) * 100));
  }

  function onPointerUp(e: React.PointerEvent) {
    drag.current = null;
    setDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      ref={frameRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className={`relative h-36 w-full rounded-lg border border-dark-border bg-cover overflow-hidden select-none ${
        coverUrl ? (dragging ? "cursor-grabbing" : "cursor-grab") : ""
      }`}
      style={
        coverUrl
          ? {
              backgroundImage: `url(${coverUrl})`,
              backgroundPosition: `center ${pos}%`,
              touchAction: "none",
            }
          : { background: "linear-gradient(120deg, #a88a3a, #c9a84c, #1a1a1a)" }
      }
    >
      {coverUrl && (
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity ${
            dragging ? "opacity-0" : "opacity-100"
          }`}
        >
          <span className="rounded-full bg-black/60 text-white text-xs px-3 py-1.5 pointer-events-none">
            ⇕ Drag to reposition
          </span>
        </div>
      )}
    </div>
  );
}
