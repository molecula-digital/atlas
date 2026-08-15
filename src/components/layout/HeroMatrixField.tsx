'use client'

import { useEffect, useRef } from 'react'
import { MATRIX_BOX_SIZE } from '@/config'

/** Fraction of grid cells that can be lit at once. */
const MAX_DENSITY = 0.035
/** How often the field picks new cells to light or fade. */
const TICK_MS = 1400
/** Cells stay lit for 2–5 ticks before fading out. */
const MIN_LIFETIME_TICKS = 2
const MAX_LIFETIME_TICKS = 5

interface ActiveCell {
  col: number
  row: number
  remaining: number
}

export function HeroMatrixField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const box = MATRIX_BOX_SIZE
    let gridCols = 0
    let gridRows = 0
    let active: ActiveCell[] = []
    let tickId: number | null = null

    function getFill() {
      const root = canvas?.parentElement ?? document.documentElement
      const styles = getComputedStyle(root)
      const color = styles.getPropertyValue('--hero-matrix-color').trim()
      const alpha = parseFloat(styles.getPropertyValue('--hero-matrix-alpha'))
      return { color, alpha: Number.isFinite(alpha) ? alpha : 0.16 }
    }

    function layout() {
      if (!canvas) return
      const parent = canvas.parentElement
      canvas.width = parent ? parent.offsetWidth : window.innerWidth
      canvas.height = parent ? parent.offsetHeight : 0
      gridCols = Math.floor(canvas.width / box)
      gridRows = Math.floor(canvas.height / box)
      active = active.filter(
        (cell) =>
          cell.col >= 0 &&
          cell.col < gridCols &&
          cell.row >= 0 &&
          cell.row < gridRows,
      )
    }

    function isOccupied(col: number, row: number) {
      return active.some((cell) => cell.col === col && cell.row === row)
    }

    function maxActiveCells() {
      return Math.max(4, Math.floor(gridCols * gridRows * MAX_DENSITY))
    }

    function pickRandomCell(): ActiveCell | null {
      if (gridCols <= 0 || gridRows <= 0) return null
      for (let attempt = 0; attempt < 12; attempt++) {
        const col = Math.floor(Math.random() * gridCols)
        const row = Math.floor(Math.random() * gridRows)
        if (!isOccupied(col, row)) {
          return {
            col,
            row,
            remaining:
              MIN_LIFETIME_TICKS +
              Math.floor(
                Math.random() * (MAX_LIFETIME_TICKS - MIN_LIFETIME_TICKS + 1),
              ),
          }
        }
      }
      return null
    }

    function tick() {
      active = active
        .map((cell) => ({ ...cell, remaining: cell.remaining - 1 }))
        .filter((cell) => cell.remaining > 0)

      const budget = maxActiveCells() - active.length
      const toAdd = Math.min(budget, 1 + Math.floor(Math.random() * 3))
      for (let i = 0; i < toAdd; i++) {
        const cell = pickRandomCell()
        if (cell) active.push(cell)
      }
      draw()
    }

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const { color, alpha } = getFill()
      if (!color) return

      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      for (const cell of active) {
        const x = cell.col * box
        const y = cell.row * box
        // 1px inset matches the matrix grid stroke so lit cells read as
        // filled lattice squares, not blobs painted over the lines.
        ctx.fillRect(x + 1, y + 1, box - 2, box - 2)
      }
      ctx.globalAlpha = 1
    }

    function seedStaticPattern() {
      active = []
      const count = Math.min(maxActiveCells(), 8)
      for (let i = 0; i < count; i++) {
        const cell = pickRandomCell()
        if (cell) active.push({ ...cell, remaining: MAX_LIFETIME_TICKS })
      }
      draw()
    }

    layout()
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (prefersReducedMotion) {
      seedStaticPattern()
    } else {
      tick()
      tickId = window.setInterval(tick, TICK_MS)
    }

    const parentObserver = new ResizeObserver(() => {
      layout()
      draw()
    })
    if (canvas.parentElement) parentObserver.observe(canvas.parentElement)

    const themeObserver = new MutationObserver(() => draw())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    return () => {
      if (tickId !== null) window.clearInterval(tickId)
      parentObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
