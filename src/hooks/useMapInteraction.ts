import { useState, useCallback, useRef, useEffect } from 'react'

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

const DRAG_THRESHOLD = 5

interface UseMapInteractionOptions {
  width: number
  height: number
  compact: boolean
}

export interface MapInteraction {
  scale: number
  translate: { x: number; y: number }
  isDragging: boolean
  interactionEnabled: boolean
  hint: string | null
  /** Ref that tracks whether a drag occurred (used to ignore clicks after drag). */
  didDragRef: React.MutableRefObject<boolean>
  containerRef: React.RefObject<HTMLDivElement | null>
  handlers: {
    onPointerDown: (e: React.PointerEvent) => void
    onPointerMove: (e: React.PointerEvent) => void
    onPointerUp: () => void
    onTouchStart: (e: React.TouchEvent) => void
  }
  zoomIn: () => void
  zoomOut: () => void
  resetView: () => void
  toggleLock: () => void
}

export function useMapInteraction({
  width,
  height,
  compact,
}: UseMapInteractionOptions): MapInteraction {
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [interactionEnabled, setInteractionEnabled] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragStart = useRef({ x: 0, y: 0 })
  const translateStart = useRef({ x: 0, y: 0 })
  const didDragRef = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Compute pan boundaries based on current scale
  const getMaxTranslate = useCallback(
    (s: number) => {
      const overflow = (s - 1) / 2
      return { maxX: overflow * width, maxY: overflow * height }
    },
    [width, height],
  )

  const constrainTranslate = useCallback(
    (x: number, y: number, s: number) => {
      const { maxX, maxY } = getMaxTranslate(s)
      return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) }
    },
    [getMaxTranslate],
  )

  // --- Drag handlers ---

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return
      didDragRef.current = false
      if (!interactionEnabled) return
      setIsDragging(true)
      dragStart.current = { x: e.clientX, y: e.clientY }
      translateStart.current = { ...translate }
      ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    },
    [translate, interactionEnabled],
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return
      const dx = e.clientX - dragStart.current.x
      const dy = e.clientY - dragStart.current.y
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        didDragRef.current = true
      }
      setTranslate(
        constrainTranslate(
          translateStart.current.x + dx,
          translateStart.current.y + dy,
          scale,
        ),
      )
    },
    [isDragging, scale, constrainTranslate],
  )

  const onPointerUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // --- Hint ---

  const showHint = useCallback((msg: string) => {
    setHint(msg)
    if (hintTimer.current) clearTimeout(hintTimer.current)
    hintTimer.current = setTimeout(() => setHint(null), 2000)
  }, [])

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!interactionEnabled && !compact && e.touches.length >= 2) {
        showHint('Desbloquea el mapa para interactuar')
      }
    },
    [interactionEnabled, compact, showHint],
  )

  // --- Wheel zoom ---

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!interactionEnabled) return
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      setScale((s) => {
        const newScale = clamp(s * factor, 0.5, 6)
        setTranslate((t) => constrainTranslate(t.x, t.y, newScale))
        return newScale
      })
    },
    [constrainTranslate, interactionEnabled],
  )

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // --- Zoom controls ---

  const zoomIn = useCallback(() => {
    setScale((s) => {
      const newScale = Math.min(s * 1.4, 6)
      setTranslate((t) => constrainTranslate(t.x, t.y, newScale))
      return newScale
    })
  }, [constrainTranslate])

  const zoomOut = useCallback(() => {
    setScale((s) => {
      const newScale = Math.max(s / 1.4, 0.5)
      setTranslate((t) => constrainTranslate(t.x, t.y, newScale))
      return newScale
    })
  }, [constrainTranslate])

  const resetView = useCallback(() => {
    setScale(1)
    setTranslate({ x: 0, y: 0 })
  }, [])

  const toggleLock = useCallback(() => {
    setInteractionEnabled((v) => !v)
  }, [])

  return {
    scale,
    translate,
    isDragging,
    interactionEnabled,
    hint,
    didDragRef,
    containerRef,
    handlers: { onPointerDown, onPointerMove, onPointerUp, onTouchStart },
    zoomIn,
    zoomOut,
    resetView,
    toggleLock,
  }
}
