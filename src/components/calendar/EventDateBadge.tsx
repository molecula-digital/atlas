import { formatEventDateBadge } from '@/lib/events'
import { cn } from '@/lib/utils'

/** The day/month tile shown beside an event in list rows. */
export function EventDateBadge({
  date,
  variant = 'default',
}: {
  date: string
  /** Quieter styling for past-event archives. */
  variant?: 'default' | 'muted'
}) {
  const { day, month } = formatEventDateBadge(date)
  const muted = variant === 'muted'
  return (
    <div
      className={cn(
        'w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border',
        muted ? 'bg-elevated border-border' : 'bg-accent/10 border-accent/20',
      )}
    >
      <span
        className={cn(
          'text-base font-sans font-bold leading-none',
          muted ? 'text-secondary' : 'text-accent',
        )}
      >
        {day}
      </span>
      <span
        className={cn(
          'text-2xs font-mono font-semibold uppercase leading-tight',
          muted ? 'text-muted' : 'text-accent',
        )}
      >
        {month}
      </span>
    </div>
  )
}
