'use client'

import Image from 'next/image'
import { Maximize2 } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { cn } from '@/lib/utils'

interface EventCoverImageProps {
  event: Pick<TechEvent, 'title' | 'image'>
  onExpand?: () => void
  className?: string
}

/**
 * Square event cover (Luma-style 1:1). Event art is almost always square, so
 * we match the frame instead of letterboxing into a landscape banner.
 */
export function EventCoverImage({
  event,
  onExpand,
  className,
}: EventCoverImageProps) {
  if (!event.image) return null

  const image = (
    <>
      <Image
        src={event.image}
        alt={event.title}
        fill
        sizes="(max-width: 768px) 100vw, (max-width: 1280px) 22rem, 26rem"
        className="object-cover"
        priority
      />
      {onExpand && (
        <span className="absolute bottom-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-2xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
          <Maximize2 size={11} />
          Ver imagen
        </span>
      )}
    </>
  )

  const containerClass = cn(
    'relative aspect-square overflow-hidden rounded-xl border border-border bg-elevated',
    onExpand && 'group cursor-pointer',
    className,
  )

  if (onExpand) {
    return (
      <button
        type="button"
        onClick={onExpand}
        className={cn(containerClass, 'w-full text-left')}
        aria-label={`Ver imagen de ${event.title}`}
      >
        {image}
      </button>
    )
  }

  return <div className={containerClass}>{image}</div>
}
