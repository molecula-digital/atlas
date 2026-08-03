'use client'

import { useState } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { buttonVariants } from '@/components/ui/button-variants'
import { EVENT_SURFACE, captureEventCardClicked } from '@/lib/analytics'
import { EventDateBadge } from './EventDateBadge'
import EventTypeBadge from './EventTypeBadge'

const INITIAL_VISIBLE = 6

function TimelineRow({ event }: { event: TechEvent }) {
  return (
    <li className="relative pl-2">
      <a
        href={getEventPath(event.slug)}
        onClick={() =>
          captureEventCardClicked(
            event,
            EVENT_SURFACE.eventsPagePastTimeline,
            'page',
          )
        }
        className="flex items-start gap-3 rounded-lg border border-border bg-card/80 p-3 text-left transition-all duration-200 hover:border-accent/30 hover:bg-elevated/50 group"
      >
        <EventDateBadge date={event.date} variant="muted" />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span className="text-sm font-sans font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">
              {event.title}
            </span>
            <EventTypeBadge isInPerson={event.isInPerson} />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
            {event.organizer && (
              <span className="text-2xs font-mono text-secondary truncate">
                {event.organizer}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1 text-2xs font-mono text-muted truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                {event.location}
              </span>
            )}
          </div>
        </div>

        <ArrowRight className="w-4 h-4 shrink-0 mt-1 text-muted group-hover:text-accent transition-colors" />
      </a>
    </li>
  )
}

export function PastEventsTimeline({ events }: { events: TechEvent[] }) {
  const [expanded, setExpanded] = useState(false)
  const hasMore = events.length > INITIAL_VISIBLE
  const visible = expanded ? events : events.slice(0, INITIAL_VISIBLE)

  return (
    <div>
      <ol className="relative space-y-3">
        {visible.map((event) => (
          <TimelineRow key={event.id} event={event} />
        ))}
      </ol>

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={buttonVariants({ variant: 'ghost', size: 'md' })}
          >
            {expanded
              ? 'Mostrar menos'
              : `Mostrar más (${events.length - INITIAL_VISIBLE})`}
          </button>
        </div>
      )}
    </div>
  )
}
