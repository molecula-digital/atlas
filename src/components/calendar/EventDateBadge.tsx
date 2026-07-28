import { formatEventDateBadge } from '@/lib/events'

/** The day/month tile shown beside an event in the upcoming lists. */
export function EventDateBadge({ date }: { date: string }) {
  const { day, month } = formatEventDateBadge(date)
  return (
    <div className="w-12 h-12 rounded-lg bg-accent/10 border border-accent/20 flex flex-col items-center justify-center shrink-0">
      <span className="text-base font-sans font-bold text-accent leading-none">{day}</span>
      <span className="text-2xs font-mono font-semibold text-accent uppercase leading-tight">
        {month}
      </span>
    </div>
  )
}
