import Image from 'next/image'
import type { TechEvent } from '@/lib/events'
import { cn } from '@/lib/utils'

/** Compact square cover used in calendar sidebars and compact event lists. */
export function EventSquareThumb({
  event,
  className,
}: {
  event: Pick<TechEvent, 'title' | 'image'>
  className?: string
}) {
  return (
    <div
      className={cn(
        'relative size-12 shrink-0 overflow-hidden rounded-md bg-elevated',
        className,
      )}
    >
      {event.image ? (
        <Image
          src={event.image}
          alt=""
          aria-hidden
          fill
          className="object-cover"
          sizes="48px"
        />
      ) : (
        <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 via-elevated to-card">
          <span className="text-sm font-mono font-bold text-accent/70">
            {event.title.charAt(0).toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}
