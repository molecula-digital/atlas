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
}

/** Luma-style date block: calendar tile + weekday/time details. */
export function EventDateDisplay({ event, className }: EventDateDisplayProps) {
  const { day } = formatEventDateBadge(event.date)
  const month = formatEventMonthShort(event.date)
  const longDate = formatEventDateLong(event.date)
  const timeRange = formatEventTimeRange(event.startTime, event.endTime)

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div
        className="flex w-[4.25rem] shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-card px-2 py-2.5 shadow-sm"
        aria-hidden
      >
        <span className="text-xs font-mono font-semibold uppercase leading-none text-muted">
          {month}
        </span>
        <span className="mt-1 text-2xl font-bold leading-none text-accent">{day}</span>
      </div>

      <div className="min-w-0 space-y-0.5">
        <p className="text-sm font-medium leading-snug text-primary">{longDate}</p>
        {timeRange && (
          <p className="text-sm leading-snug text-muted">{timeRange}</p>
        )}
      </div>
    </div>
  )
}
