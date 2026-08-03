import React from 'react'

export interface TooltipState {
  x: number
  y: number
  name: string
  count: number
}

interface MapTooltipProps {
  tooltip: TooltipState
}

export default function MapTooltip({ tooltip }: MapTooltipProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: tooltip.x + 12,
        top: tooltip.y - 10,
        pointerEvents: 'none',
        zIndex: 10,
      }}
      className="bg-elevated border border-border rounded px-2.5 py-1.5 shadow-lg"
    >
      <div className="text-xs font-mono font-semibold text-accent">
        {tooltip.name}
      </div>
      {tooltip.count > 0 && (
        <div className="text-2xs font-mono text-muted">
          {tooltip.count} {tooltip.count === 1 ? 'registro' : 'registros'}
        </div>
      )}
    </div>
  )
}
