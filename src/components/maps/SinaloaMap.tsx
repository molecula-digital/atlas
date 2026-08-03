'use client'

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import {
  geoIdentity,
  geoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from 'd3-geo'
import {
  ComposableMap,
  Geographies,
  Geography,
  type ProjectionFunction,
} from 'react-simple-maps'
import { useMapInteraction } from '@/hooks/useMapInteraction'
import MapTooltip, { type TooltipState } from './MapTooltip'
import MapPopup, { type PopupState } from './MapPopup'
import MapControls from './MapControls'

const TOPO_URL = '/topo/Sinaloa_municipios.json'
const ACCENT = 'var(--color-accent)'
const DITHER_PATTERN_ID = 'sinaloa-map-dither'

// Pre-projected TopoJSON bounding box (Mexican CRS, meters)
const BOUNDS = {
  minX: 1758069.925,
  maxX: 2154354.388,
  minY: 1165418.1,
  maxY: 1679049.332,
}

/** GeoJSON feature shape returned by react-simple-maps Geographies. */
interface MapGeography extends GeoJSON.Feature {
  properties: Record<string, unknown>
  rsmKey?: string
}

interface CityCounts {
  [name: string]: number
}

interface SinaloaMapProps {
  compact?: boolean
  cityCounts?: CityCounts
  /** When true, clicking a city opens /directorio/{id} in a new tab instead of showing a popup. */
  linkOnClick?: boolean
  /** Externally selected city id to highlight on the map. */
  selectedCity?: string | null
  /** Overlay a halftone dot pattern clipped to the municipality shapes. */
  dither?: boolean
  /** Pulse a marker over every municipality that has entries. */
  pulseActive?: boolean
}

/** Captures geographies into a ref via useEffect instead of during render. */
function GeographiesCapture({
  geographies,
  geographiesRef,
}: {
  geographies: MapGeography[]
  geographiesRef: React.MutableRefObject<MapGeography[]>
}) {
  useEffect(() => {
    geographiesRef.current = geographies
  }, [geographies, geographiesRef])
  return null
}

function createProjection(width: number, height: number, padding: number) {
  return geoIdentity()
    .reflectY(true)
    .fitExtent(
      [
        [padding, padding],
        [width - padding, height - padding],
      ],
      {
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [BOUNDS.minX, BOUNDS.minY],
              [BOUNDS.maxX, BOUNDS.minY],
              [BOUNDS.maxX, BOUNDS.maxY],
              [BOUNDS.minX, BOUNDS.maxY],
              [BOUNDS.minX, BOUNDS.minY],
            ],
          ],
        },
        properties: {},
      },
    )
}

export default function SinaloaMap({
  compact = false,
  cityCounts = {},
  linkOnClick = false,
  selectedCity = null,
  dither = false,
  pulseActive = false,
}: SinaloaMapProps) {
  const width = compact ? 380 : 800
  const height = compact ? 450 : 800
  const padding = compact ? 5 : 40
  const markerRadius = compact ? 2.5 : 5

  const {
    scale,
    translate,
    isDragging,
    interactionEnabled,
    hint,
    didDragRef,
    containerRef,
    handlers,
    zoomIn,
    zoomOut,
    resetView,
    toggleLock,
  } = useMapInteraction({ width, height, compact })

  const [tooltip, setTooltip] = useState<TooltipState | null>(null)
  const [popup, setPopup] = useState<PopupState | null>(null)
  const geographiesRef = useRef<MapGeography[]>([])

  const projection = useMemo(
    () => createProjection(width, height, padding),
    [width, height, padding],
  )
  const pathGenerator = useMemo(() => geoPath(projection), [projection])
  const [containerSize, setContainerSize] = useState({
    width: 800,
    height: 800,
  })

  useEffect(() => {
    const node = containerRef.current
    if (!node) return
    const updateSize = () =>
      setContainerSize({ width: node.offsetWidth, height: node.offsetHeight })
    updateSize()
    const observer = new ResizeObserver(updateSize)
    observer.observe(node)
    return () => observer.disconnect()
  }, [containerRef])

  // Close popup on outside click
  useEffect(() => {
    if (!popup) return
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('[data-map-popup]')) return
      setPopup(null)
    }
    window.addEventListener('click', handleClickOutside, { capture: true })
    return () =>
      window.removeEventListener('click', handleClickOutside, {
        capture: true,
      })
  }, [popup])

  // Tooltip handlers
  const handleMouseEnter = useCallback(
    (geo: MapGeography, e: React.MouseEvent) => {
      if (popup) return
      const name =
        typeof geo.properties?.name === 'string'
          ? geo.properties.name
          : undefined
      const id =
        typeof geo.properties?.id === 'string' ? geo.properties.id : undefined
      if (!name) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      const count = id ? cityCounts[id] || 0 : 0
      setTooltip({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        name,
        count,
      })
    },
    [cityCounts, popup, containerRef],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!tooltip || popup) return
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return
      setTooltip((prev) =>
        prev
          ? { ...prev, x: e.clientX - rect.left, y: e.clientY - rect.top }
          : null,
      )
    },
    [tooltip, popup, containerRef],
  )

  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // Open popup at a geography's centroid
  const openPopupForGeo = useCallback(
    (geo: MapGeography) => {
      const id =
        typeof geo.properties?.id === 'string' ? geo.properties.id : undefined
      const name =
        typeof geo.properties?.name === 'string'
          ? geo.properties.name
          : undefined
      if (!id || !name) return

      const centroid = pathGenerator.centroid(geo)
      if (!centroid || isNaN(centroid[0])) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const svgEl = containerRef.current?.querySelector('svg')
      if (!svgEl) return
      const svgRect = svgEl.getBoundingClientRect()
      const scaleX = svgRect.width / width
      const scaleY = svgRect.height / height
      const px =
        centroid[0] * scaleX * scale +
        translate.x +
        (rect.width - svgRect.width * scale) / 2
      const py =
        centroid[1] * scaleY * scale +
        translate.y +
        (rect.height - svgRect.height * scale) / 2

      const count = cityCounts[id] || 0
      setTooltip(null)
      setPopup({ x: px, y: py, id, name, count })
    },
    [cityCounts, pathGenerator, scale, translate, width, height, containerRef],
  )

  // Click handler
  const handleGeoClick = useCallback(
    (geo: MapGeography) => {
      if (didDragRef.current) return
      if (linkOnClick) {
        const id = geo.properties?.id
        if (id) window.open(`/directorio/${id}`, '_blank', 'noopener')
        return
      }
      if (compact) return
      openPopupForGeo(geo)
    },
    [compact, linkOnClick, openPopupForGeo, didDragRef],
  )

  // Sync sidebar selection -> map popup
  const openPopupRef = useRef(openPopupForGeo)
  useEffect(() => {
    openPopupRef.current = openPopupForGeo
  }, [openPopupForGeo])

  useEffect(() => {
    if (!selectedCity || compact) {
      queueMicrotask(() => setPopup(null))
      return
    }
    const geo = geographiesRef.current.find(
      (g) => g.properties?.id === selectedCity,
    )
    if (geo) {
      openPopupRef.current(geo)
    } else {
      queueMicrotask(() => setPopup(null))
    }
  }, [selectedCity, compact])

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{
        cursor: !interactionEnabled
          ? 'default'
          : isDragging
            ? 'grabbing'
            : 'grab',
        touchAction: interactionEnabled ? 'none' : 'auto',
      }}
      onTouchStart={handlers.onTouchStart}
    >
      <div
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: 'center center',
          transition: isDragging ? 'none' : 'transform 0.2s ease-out',
          width: '100%',
          height: '100%',
        }}
        onPointerDown={handlers.onPointerDown}
        onPointerMove={handlers.onPointerMove}
        onPointerUp={handlers.onPointerUp}
        onPointerCancel={handlers.onPointerUp}
      >
        <ComposableMap
          width={width}
          height={height}
          projection={
            ((mapWidth, mapHeight) =>
              createProjection(
                mapWidth,
                mapHeight,
                padding,
              ) as unknown as GeoProjection) satisfies ProjectionFunction
          }
          projectionConfig={{}}
          style={{ width: '100%', height: '100%' }}
        >
          {dither && (
            <defs>
              <pattern
                id={DITHER_PATTERN_ID}
                width="3.5"
                height="3.5"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="0.9" cy="0.9" r="0.85" fill={ACCENT} />
              </pattern>
            </defs>
          )}
          <Geographies geography={TOPO_URL}>
            {({ geographies }) => (
              <>
                <GeographiesCapture
                  geographies={geographies}
                  geographiesRef={geographiesRef}
                />
                {geographies.map((geo) => {
                  const mapGeo = geo as unknown as MapGeography
                  const geoId = mapGeo.properties?.id as string | undefined
                  const isHighlighted =
                    (popup && popup.id === geoId) ||
                    (selectedCity && selectedCity === geoId)
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => handleGeoClick(mapGeo)}
                      onMouseEnter={(e) => handleMouseEnter(mapGeo, e)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                      style={{
                        default: {
                          fill: ACCENT,
                          fillOpacity: isHighlighted ? 0.15 : 0.05,
                          stroke: ACCENT,
                          strokeWidth: isHighlighted ? 1.4 : 1,
                          strokeOpacity: isHighlighted ? 1 : 0.6,
                          outline: 'none',
                        },
                        hover: {
                          fill: ACCENT,
                          fillOpacity: 0.2,
                          stroke: ACCENT,
                          strokeWidth: 1.4,
                          strokeOpacity: 1,
                          outline: 'none',
                          cursor: isDragging ? 'grabbing' : 'pointer',
                        },
                        pressed: {
                          fill: ACCENT,
                          fillOpacity: 0.3,
                          stroke: ACCENT,
                          strokeWidth: 1.4,
                          strokeOpacity: 1,
                          outline: 'none',
                        },
                      }}
                    />
                  )
                })}

                {/* Halftone pass — clipped to the shapes, never eats pointer events */}
                {dither && (
                  <g pointerEvents="none" opacity={0.5}>
                    {geographies.map((geo) => (
                      <path
                        key={`dither-${geo.rsmKey}`}
                        d={
                          pathGenerator(
                            geo as unknown as GeoPermissibleObjects,
                          ) ?? undefined
                        }
                        fill={`url(#${DITHER_PATTERN_ID})`}
                      />
                    ))}
                  </g>
                )}

                {/* Radar ping over municipalities that actually have entries */}
                {pulseActive && (
                  <g pointerEvents="none">
                    {geographies.map((geo, i) => {
                      const mapGeo = geo as unknown as MapGeography
                      const geoId = mapGeo.properties?.id as string | undefined
                      if (!geoId || !cityCounts[geoId]) return null
                      const [cx, cy] = pathGenerator.centroid(
                        geo as unknown as GeoPermissibleObjects,
                      )
                      if (!Number.isFinite(cx) || !Number.isFinite(cy))
                        return null
                      // Stagger so the pings read as a scan, not a heartbeat
                      const delay = `${(i % 6) * 0.45}s`
                      return (
                        <g key={`ping-${geo.rsmKey}`}>
                          <circle
                            className="map-ping-ring"
                            cx={cx}
                            cy={cy}
                            r={markerRadius}
                            fill="none"
                            stroke={ACCENT}
                            strokeWidth={compact ? 0.8 : 1.5}
                            style={{ animationDelay: delay }}
                          />
                          <circle
                            className="map-ping-dot"
                            cx={cx}
                            cy={cy}
                            r={markerRadius * 0.55}
                            fill={ACCENT}
                            style={{ animationDelay: delay }}
                          />
                        </g>
                      )
                    })}
                  </g>
                )}
              </>
            )}
          </Geographies>
        </ComposableMap>
      </div>

      {/* Hover tooltip */}
      {tooltip && !popup && <MapTooltip tooltip={tooltip} />}

      {/* Click popup */}
      {popup && (
        <MapPopup
          popup={popup}
          containerWidth={containerSize.width}
          containerHeight={containerSize.height}
          onClose={() => setPopup(null)}
        />
      )}

      {/* Interaction hint (mobile pinch while locked) */}
      {hint && !compact && (
        <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
          <div className="px-4 py-2.5 rounded-lg bg-black/70 text-white text-sm font-mono shadow-lg">
            {hint}
          </div>
        </div>
      )}

      {/* Controls (hidden in compact mode) */}
      {!compact && (
        <MapControls
          interactionEnabled={interactionEnabled}
          onToggleLock={toggleLock}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onReset={resetView}
        />
      )}
    </div>
  )
}
