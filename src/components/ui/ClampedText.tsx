'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip'

interface ClampedTextProps {
  text: string
  /** Clamp/truncate classes come from the caller — this only measures the result. */
  className?: string
  side?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Text that reveals its full string on hover, but only when the clamp actually cut it off —
 * a tooltip repeating text you can already read is noise.
 */
export function ClampedText({
  text,
  className,
  side = 'bottom',
}: ClampedTextProps) {
  const ref = useRef<HTMLParagraphElement>(null)
  const [isClamped, setIsClamped] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // 1px slack: sub-pixel line heights make scrollHeight drift past clientHeight on some zoom levels
    const measure = () =>
      setIsClamped(
        el.scrollHeight > el.clientHeight + 1 ||
          el.scrollWidth > el.clientWidth + 1,
      )

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [text])

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <p ref={ref} className={className}>
          {text}
        </p>
      </TooltipTrigger>
      {isClamped && <TooltipContent side={side}>{text}</TooltipContent>}
    </Tooltip>
  )
}
