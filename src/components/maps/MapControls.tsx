import React from "react";
import { ZoomIn, ZoomOut, RotateCcw, Lock, Unlock } from "lucide-react";
import { buttonVariants } from '@/components/ui/button-variants';

interface MapControlsProps {
  interactionEnabled: boolean;
  onToggleLock: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

export default function MapControls({
  interactionEnabled,
  onToggleLock,
  onZoomIn,
  onZoomOut,
  onReset,
}: MapControlsProps) {
  return (
    <>
      {/* Locked banner */}
      {!interactionEnabled && (
        <button
          type="button"
          onClick={() => onToggleLock()}
          className={buttonVariants({ size: "md", className: "absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-muted backdrop-blur-sm" })}
        >
          <Lock size={12} />
          Toca para interactuar
        </button>
      )}

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1.5">
        <button
          onClick={onToggleLock}
          className={buttonVariants({ variant: interactionEnabled ? "accent" : "neutral", size: "icon-lg", className: "rounded-lg", })}
          aria-label={
            interactionEnabled ? "Bloquear mapa" : "Desbloquear mapa"
          }
          title={
            interactionEnabled ? "Bloquear pan/zoom" : "Desbloquear pan/zoom"
          }
        >
          {interactionEnabled ? <Unlock size={16} /> : <Lock size={16} />}
        </button>
        <button
          onClick={onZoomIn}
          disabled={!interactionEnabled}
          className={buttonVariants({ size: "icon-lg", className: "rounded-lg" })}
          aria-label="Acercar"
        >
          <ZoomIn size={16} />
        </button>
        <button
          onClick={onZoomOut}
          disabled={!interactionEnabled}
          className={buttonVariants({ size: "icon-lg", className: "rounded-lg" })}
          aria-label="Alejar"
        >
          <ZoomOut size={16} />
        </button>
        <button
          onClick={onReset}
          disabled={!interactionEnabled}
          className={buttonVariants({ size: "icon-lg", className: "rounded-lg" })}
          aria-label="Resetear zoom"
        >
          <RotateCcw size={16} />
        </button>
      </div>
    </>
  );
}
