import type { ReactNode } from 'react'
import type { TechEvent } from '@/lib/events'
import {
  formatEventDateBadge,
  formatEventDateLong,
  formatEventMonthShort,
  formatEventTimeRange,
} from '@/lib/events'
import { cn } from '@/lib/utils'

interface EventDateDisplayProps {
  event: Pick<TechEvent, 'date' | 'startTime' | 'endTime'>
  className?: string
  /** Optional chip (e.g. Hoy) shown beside the long date. */
  badge?: ReactNode
}

/** Date squircle tile (matches Organiza / Ubicación), plus details. */
export function EventDateDisplay({
  event,
  className,
  badge,
}: EventDateDisplayProps) {
  const { day } = formatEventDateBadge(event.date)
  const month = formatEventMonthShort(event.date)
  const longDate = formatEventDateLong(event.date)
  const timeRange = formatEventTimeRange(event.startTime, event.endTime)

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className="flex size-10 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-elevated"
        aria-hidden
      >
        <span className="text-[9px] font-mono font-semibold uppercase leading-none text-muted">
          {month}
        </span>
        <span className="mt-0.5 text-sm font-bold leading-none text-accent">
          {day}
        </span>
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-snug text-primary">
          {longDate}
          {badge ? (
            <span className="ml-2 inline-flex align-middle">{badge}</span>
          ) : null}
        </p>
        {timeRange && (
          <p className="text-sm leading-snug text-muted">{timeRange}</p>
        )}
      </div>
    </div>
  )
}
