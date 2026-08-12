import React from 'react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export interface PopupState {
  x: number
  y: number
  id: string
  name: string
  count: number
}

interface MapPopupProps {
  popup: PopupState
  containerWidth: number
  containerHeight: number
  onClose: () => void
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
        position: 'absolute',
        left: clamp(popup.x - 100, 8, containerWidth - 208),
        top: clamp(popup.y - 120, 8, containerHeight - 8),
        zIndex: 20,
        width: 200,
      }}
      className="bg-card border border-border rounded-lg shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-border flex items-center justify-between">
        <span className="text-sm font-mono font-bold text-accent">
          {popup.name}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          className="cursor-pointer text-xs leading-none text-muted transition-colors hover:text-primary"
          aria-label="Cerrar"
        >
          ✕
        </button>
      </div>

      {/* Body */}
      {popup.count > 0 ? (
        <div className="px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-muted">Registros</span>
            <span className="text-xs font-mono font-bold text-primary">
              {popup.count}
            </span>
          </div>
          <Link
            href={`/directorio/${popup.id}`}
            className={buttonVariants({
              variant: 'accent',
              size: 'sm',
              className: 'w-full',
            })}
          >
            VER COMUNIDAD →
          </Link>
        </div>
      ) : (
        <div className="px-3 py-2.5 space-y-2 text-center">
          <p className="text-xs text-muted font-mono">Aún no hay registros</p>
          <Link
            href="/dashboard"
            className={buttonVariants({
              variant: 'accent',
              size: 'sm',
              className: 'w-full border-dashed',
            })}
          >
            REGISTRAR →
          </Link>
        </div>
      )}
    </div>
  )
}
