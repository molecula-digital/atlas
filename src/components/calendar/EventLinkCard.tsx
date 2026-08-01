'use client'

import { MapPin, ArrowUpRight } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { EVENT_SURFACE, captureEventCardClicked } from '@/lib/analytics'
import { EventDateBadge } from './EventDateBadge'
import EventTypeBadge from './EventTypeBadge'

/** Compact link card for related / other event grids. */
export function EventLinkCard({ event }: { event: TechEvent }) {
  return (
    <a
      href={getEventPath(event.slug)}
      onClick={() =>
        captureEventCardClicked(event, EVENT_SURFACE.detailRelated, 'page')
      }
      className="w-full h-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-accent/40 hover:shadow-sm cursor-pointer group"
    >
      <EventDateBadge date={event.date} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-sans font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {event.title}
          </span>
          <span className="shrink-0">
            <EventTypeBadge isInPerson={event.isInPerson} />
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
          {event.organizer && (
            <span className="text-xs font-mono text-muted truncate min-w-0">
              {event.organizer}
            </span>
          )}
          {event.startTime && (
            <span className="text-xs font-mono text-muted shrink-0 whitespace-nowrap">
              · {event.startTime}
            </span>
          )}
        </div>
        {event.location && (
          <span className="inline-flex items-center gap-1 text-2xs font-mono text-muted mt-0.5 truncate max-w-full">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            {event.location}
          </span>
        )}
      </div>

      <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
    </a>
  )
}
