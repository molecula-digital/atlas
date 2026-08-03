'use client'

import { useEffect, useRef } from 'react'
import { MATRIX_BOX_SIZE } from '@/config'

type MovementDirection =
  | 'none'
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'up-left'
  | 'up-right'
  | 'down-left'
  | 'down-right'

interface MatrixBackgroundProps {
  highlight?: boolean
  highlightColor?: string
  boxSize?: number
  movementDirection?: MovementDirection
  movementSpeed?: number
  /** Movement is opt-in — the grid renders static unless this is enabled. */
  animate?: boolean
}

export function MatrixBackground({
  highlight = true,
  highlightColor = 'rgba(20, 184, 166, 0.3)',
  boxSize = MATRIX_BOX_SIZE,
  movementDirection = 'none',
  movementSpeed = 0.5,
  animate = false,
}: MatrixBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const darkEdgeColor = 'rgba(63, 63, 70, 0.22)'
    const lightEdgeColor = 'rgba(120, 120, 120, 0.22)'

    function getEdgeColor() {
      return document.documentElement.classList.contains('dark')
        ? darkEdgeColor
        : lightEdgeColor
    }

    let mouseX = -1000
    let mouseY = -1000
    const offset = { x: 0, y: 0 }
    let animationId: number
    let isRunning = true

    // Movement logic is kept intact but only runs when explicitly enabled.
    const isMoving = animate && movementDirection !== 'none'
    // Only keep a render loop alive when something can actually change.
    const needsLoop = isMoving || highlight

    function resize() {
      if (!canvas) return
      const parent = canvas.parentElement
      canvas.width = parent ? parent.offsetWidth : window.innerWidth
      canvas.height = parent ? parent.offsetHeight : window.innerHeight
    }

    function getBoxAtPosition(x: number, y: number) {
      const adjustedX = x - offset.x
      const adjustedY = y - offset.y
      return {
        col: Math.floor(adjustedX / boxSize),
        row: Math.floor(adjustedY / boxSize),
      }
    }

    function draw() {
      if (!isRunning || !canvas || !ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const edgeColor = getEdgeColor()

      const startCol = Math.floor(-offset.x / boxSize) - 1
      const endCol = Math.ceil((canvas.width - offset.x) / boxSize) + 1
      const startRow = Math.floor(-offset.y / boxSize) - 1
      const endRow = Math.ceil((canvas.height - offset.y) / boxSize) + 1

      const hoveredBox = getBoxAtPosition(mouseX, mouseY)

      for (let row = startRow; row <= endRow; row++) {
        for (let col = startCol; col <= endCol; col++) {
          const x = col * boxSize + offset.x
          const y = row * boxSize + offset.y

          const isHovered = col === hoveredBox.col && row === hoveredBox.row

          if (highlight && isHovered) {
            ctx.fillStyle = highlightColor!
            ctx.fillRect(x, y, boxSize, boxSize)
          }

          ctx.strokeStyle = edgeColor
          ctx.lineWidth = 1
          ctx.strokeRect(x + 0.5, y + 0.5, boxSize, boxSize)
        }
      }

      if (isMoving) {
        const moveUp = movementDirection.includes('up')
        const moveDown = movementDirection.includes('down')
        const moveLeft = movementDirection.includes('left')
        const moveRight = movementDirection.includes('right')

        if (moveUp) {
          offset.y -= movementSpeed
          if (offset.y <= -boxSize) offset.y += boxSize
        }
        if (moveDown) {
          offset.y += movementSpeed
          if (offset.y >= boxSize) offset.y -= boxSize
        }
        if (moveLeft) {
          offset.x -= movementSpeed
          if (offset.x <= -boxSize) offset.x += boxSize
        }
        if (moveRight) {
          offset.x += movementSpeed
          if (offset.x >= boxSize) offset.x -= boxSize
        }
      }

      if (needsLoop) animationId = requestAnimationFrame(draw)
    }

    function handleResize() {
      resize()
      // A live loop repaints on its own next frame; calling draw() here too
      // would start a second requestAnimationFrame chain.
      if (!needsLoop) draw()
    }

    function handleMouseMove(e: MouseEvent) {
      mouseX = e.clientX
      mouseY = e.clientY
    }

    function handleMouseLeave() {
      mouseX = -1000
      mouseY = -1000
    }

    resize()
    window.addEventListener('resize', handleResize)

    // A client-side route change swaps the page content without firing a window
    // resize, so the canvas would keep the previous page's height. Because a
    // canvas is a replaced element, that stale height stays in its intrinsic
    // size and adds scrollable overflow below the footer.
    const parentObserver = new ResizeObserver(handleResize)
    if (canvas.parentElement) parentObserver.observe(canvas.parentElement)

    if (highlight) {
      window.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseleave', handleMouseLeave)
    }

    // Static grids need an explicit repaint when the theme flips.
    const themeObserver = needsLoop ? null : new MutationObserver(() => draw())
    themeObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    })

    draw()

    return () => {
      isRunning = false
      cancelAnimationFrame(animationId)
      parentObserver.disconnect()
      themeObserver?.disconnect()
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [
    highlight,
    highlightColor,
    boxSize,
    movementDirection,
    movementSpeed,
    animate,
  ])

  // h-full/w-full pin the CSS box to the parent; without them the width and
  // height attributes act as the canvas's intrinsic size and can overflow the page.
  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full -z-10 pointer-events-none opacity-25"
      aria-hidden="true"
    />
  )
}
