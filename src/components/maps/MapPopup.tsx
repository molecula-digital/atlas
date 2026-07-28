import React from "react";
import { buttonVariants } from '@/components/ui/Button';

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

export interface PopupState {
  x: number;
  y: number;
  id: string;
  name: string;
  count: number;
}

interface MapPopupProps {
  popup: PopupState;
  containerWidth: number;
  containerHeight: number;
  onClose: () => void;
}

export default function MapPopup({
  popup,
  containerWidth,
  containerHeight,
  onClose,
}: MapPopupProps) {
  return (
    <div
      data-map-popup
      style={{
        position: "absolute",
        left: clamp(popup.x - 100, 8, containerWidth - 208),
        top: clamp(popup.y - 120, 8, containerHeight - 8),
        zIndex: 20,
        width: 200,
      }}
      className="bg-[var(--color-card)] border border-[var(--color-border)] rounded-lg shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-[var(--color-border)] flex items-center justify-between">
        <span className="text-sm font-mono font-bold text-accent">
          {popup.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="text-[var(--color-muted)] hover:text-[var(--color-primary)] transition-colors text-xs leading-none"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {popup.count > 0 ? (
        <div className="px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-[var(--color-muted)]">
              Registros
            </span>
            <span className="text-xs font-mono font-bold text-[var(--color-primary)]">
              {popup.count}
            </span>
          </div>
          <a
            href={`/directorio/${popup.id}`}
            className={buttonVariants({ variant: "accent", size: "sm", className: "w-full" })}
          >
            VER COMUNIDAD →
          </a>
        </div>
      ) : (
        <div className="px-3 py-2.5 space-y-2 text-center">
          <p className="text-xs text-[var(--color-muted)] font-mono">
            Aún no hay registros
          </p>
          <a
            href="/dashboard"
            className={buttonVariants({ variant: "accent", size: "sm", className: "w-full border-dashed" })}
          >
            REGISTRAR →
          </a>
        </div>
      )}
    </div>
  );
}
