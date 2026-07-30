import type { TechEvent } from '@/lib/events'
import { EventLinkCard } from './EventLinkCard'

/** Related-events grid for event detail pages (mirrors entry “Mira mas”). */
export function OtherEventsSection({ events }: { events: TechEvent[] }) {
  if (events.length === 0) return null

  return (
    <section className="mt-10">
      <h2 className="text-lg font-bold text-primary mb-4">Otros eventos</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map((event) => (
          <EventLinkCard key={event.id} event={event} />
        ))}
      </div>
    </section>
  )
}
