'use client'

import { useEffect, useRef } from 'react'
import { MATRIX_BOX_SIZE } from '@/config'

/**
 * Two-frame sprite bitmaps, one species per formation row (squid / crab /
 * octopus, top to bottom — the classic fleet order). Original pixel art in
 * the canonical arcade silhouettes, authored as strings so the shapes stay
 * readable and editable in source. Every '#' is painted as an exact fraction
 * of a background-grid cell (see SPRITE_PIXEL_DIVISOR), which is why the
 * bitmaps are this small.
 */
const SPRITES: ReadonlyArray<readonly [readonly string[], readonly string[]]> =
  [
    [
      [
        '.....#.....',
        '....###....',
        '...#####...',
        '..##.#.##..',
        '..#######..',
        '....#.#....',
        '...#.#.#...',
        '..#.#.#.#..',
      ],
      [
        '.....#.....',
        '....###....',
        '...#####...',
        '..##.#.##..',
        '..#######..',
        '...#.#.#...',
        '..#.....#..',
        '...#...#...',
      ],
    ],
    [
      [
        '.#.......#.',
        '..#.....#..',
        '..#######..',
        '.##.###.##.',
        '###########',
        '#.#######.#',
        '#.#.....#.#',
        '...##.##...',
      ],
      [
        '.#.......#.',
        '#.#.....#.#',
        '#.#######.#',
        '###.###.###',
        '.#########.',
        '..#######..',
        '..#.....#..',
        '.#.......#.',
      ],
    ],
    [
      [
        '...#####...',
        '.#########.',
        '###########',
        '###.###.###',
        '###########',
        '...##.##...',
        '..##...##..',
        '.##.....##.',
      ],
      [
        '...#####...',
        '.#########.',
        '###########',
        '###.###.###',
        '###########',
        '..##.#.##..',
        '.#.......#.',
        '..#.....#..',
      ],
    ],
  ]

const SPRITE_COLS = 11
const SPRITE_ROWS = 8
/**
 * Sprite pixels are an exact divisor of the grid cell rather than one whole
 * cell: at 26px per pixel an 11x8 sprite is ~286x208px and the eye reads a
 * field of loose squares, not a silhouette. Dividing by two keeps every
 * second pixel edge on a lattice line — the sprites still look built out of
 * the grid — while the shapes shrink to ~143x104px, small enough to
 * recognize at a glance.
 */
const SPRITE_PIXEL_DIVISOR = 2
const PIXEL = MATRIX_BOX_SIZE / SPRITE_PIXEL_DIVISOR
/** Sprite footprint in whole grid cells — origins and the march stay on the lattice. */
const SPRITE_CELLS_W = Math.ceil(SPRITE_COLS / SPRITE_PIXEL_DIVISOR)
const SPRITE_CELLS_H = Math.ceil(SPRITE_ROWS / SPRITE_PIXEL_DIVISOR)
/**
 * Cells of air between invaders in the formation. Rows sit further apart than
 * columns: a sprite is only 4 cells tall against 6 wide, so an equal gap left
 * the rows reading as one vertical mass rather than distinct ranks.
 */
const COL_GAP = 1
const ROW_GAP = 2
/** Classic march cadence — one sideways cell per step, frame toggle included. */
const STEP_MS = 900
const MAX_FORMATION_COLS = 7
/** Never lay out a formation with less sideways march room than this. */
const MIN_MARCH_CELLS = 4
/** Cells between the top of the page and the formation's first row. */
const START_ROW = 1

export function InvaderField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const box = MATRIX_BOX_SIZE

    // Formation state, all in grid-cell coordinates. The matrix lattice
    // starts at (0,0) of the layout wrapper, and this canvas shares that
    // origin (HeroBackdrop is pinned inset-x-0 top-0 inside the same
    // wrapper), so cell (col, row) here is the same square in both layers —
    // no offset correction needed.
    let rows = 0
    let cols = 0
    let bandCols = 0
    let gridRows = 0
    let originCol = 1
    let originRow = START_ROW
    let direction = 1
    let frame: 0 | 1 = 0

    const formationWidth = () => cols * SPRITE_CELLS_W + (cols - 1) * COL_GAP
    const formationHeight = () => rows * SPRITE_CELLS_H + (rows - 1) * ROW_GAP

    function layout() {
      if (!canvas) return
      const parent = canvas.parentElement
      canvas.width = parent ? parent.offsetWidth : window.innerWidth
      canvas.height = parent ? parent.offsetHeight : 0

      const gridCols = Math.floor(canvas.width / box)
      gridRows = Math.floor(canvas.height / box)

      // Below ~sm the hero is cramped — dropping a row (the column fit below
      // already collapses on narrow canvases) keeps it sparse.
      const small = canvas.width < 640
      rows = small ? 2 : SPRITES.length

      // Bias the band left at lg and up so the fleet stays out from under the
      // map card occupying the hero's right column.
      bandCols = canvas.width >= 1024 ? Math.floor(gridCols * 0.62) : gridCols

      // Column count comes from what fits the band with march room to spare,
      // capped at the classic formation width.
      const fit = Math.floor(
        (bandCols - MIN_MARCH_CELLS + COL_GAP) / (SPRITE_CELLS_W + COL_GAP),
      )
      cols = Math.max(1, Math.min(fit, MAX_FORMATION_COLS))

      // A resize can strand the formation outside the band; pull it back in.
      originCol = Math.max(0, Math.min(originCol, bandCols - formationWidth()))
      if (originRow + formationHeight() > gridRows) originRow = START_ROW
    }

    function getFill() {
      // Read hero-backdrop tokens so the sprites track theme without tying
      // them to the accent green. Target: roughly the visual weight of the
      // matrix grid lines — shapes you notice on a second look, never louder
      // than the headline.
      const root = canvas?.parentElement ?? document.documentElement
      const styles = getComputedStyle(root)
      const color = styles.getPropertyValue('--hero-matrix-color').trim()
      const alpha = parseFloat(styles.getPropertyValue('--hero-matrix-alpha'))
      return { color, alpha: Number.isFinite(alpha) ? alpha : 0.25 }
    }

    function drawSprite(
      bitmap: readonly string[],
      cellX: number,
      cellY: number,
    ) {
      if (!ctx) return
      const originX = cellX * box
      const originY = cellY * box
      for (let y = 0; y < bitmap.length; y++) {
        const line = bitmap[y]
        for (let x = 0; x < line.length; x++) {
          if (line[x] !== '#') continue
          // 1px inset per block keeps a visible seam between adjacent pixels
          // so the sprites read as pixel art built from the lattice, not a
          // solid smear painted over it.
          ctx.fillRect(
            originX + x * PIXEL + 1,
            originY + y * PIXEL + 1,
            PIXEL - 2,
            PIXEL - 2,
          )
        }
      }
    }

    function draw() {
      if (!canvas || !ctx) return
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const { color, alpha } = getFill()
      ctx.fillStyle = color
      ctx.globalAlpha = alpha
      for (let r = 0; r < rows; r++) {
        const bitmap = SPRITES[r][frame]
        const cellY = originRow + r * (SPRITE_CELLS_H + ROW_GAP)
        for (let c = 0; c < cols; c++) {
          drawSprite(bitmap, originCol + c * (SPRITE_CELLS_W + COL_GAP), cellY)
        }
      }
      ctx.globalAlpha = 1
    }

    function step() {
      const nextCol = originCol + direction
      if (nextCol < 0 || nextCol + formationWidth() > bandCols) {
        // Classic edge behavior: drop one row and reverse. When the fleet
        // runs out of band it wraps back to the top and keeps going — there
        // is no game here, just the march.
        direction = -direction
        originRow += 1
        if (originRow + formationHeight() > gridRows) originRow = START_ROW
      } else {
        originCol = nextCol
      }
      frame = frame === 0 ? 1 : 0
      draw()
    }

    layout()
    draw()

    // Same reasoning as MatrixBackground: a client-side layout change can
    // resize the parent without a window resize event, and a canvas keeps its
    // stale intrinsic size otherwise. Window resizes also reach us through
    // this observer, since the parent spans the full viewport width.
    const parentObserver = new ResizeObserver(() => {
      layout()
      draw()
    })
    if (canvas.parentElement) parentObserver.observe(canvas.parentElement)

    // The fill is read from hero-backdrop matrix tokens, so a theme flip needs
    // an explicit repaint — same approach as the static matrix grid.
    const themeObserver = new MutationObserver(() => draw())
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    // One step per ~900ms and nothing changes between steps, so a plain
    // interval is the right driver here — a requestAnimationFrame loop would
    // burn 60 repaints a second to show a once-a-second change. Reduced
    // motion keeps the single static frame drawn above.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches
    const intervalId = prefersReducedMotion
      ? null
      : window.setInterval(step, STEP_MS)

    return () => {
      if (intervalId !== null) window.clearInterval(intervalId)
      parentObserver.disconnect()
      themeObserver.disconnect()
    }
  }, [])

  // h-full/w-full pin the CSS box to the parent, same as MatrixBackground —
  // without them the intrinsic width/height attributes would size the box.
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  )
}
