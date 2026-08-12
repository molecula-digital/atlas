'use client'

import type { TechEvent } from '@/lib/events'
import { EventDetailView } from '@/components/calendar/EventDetailView'

/** About section + view analytics for the event detail page. */
export default function EventDetailPageClient({ event }: { event: TechEvent }) {
  return <EventDetailView event={event} />
}
