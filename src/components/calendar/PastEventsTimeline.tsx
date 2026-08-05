'use client'

import { useState } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { formatEventDateBadge, getEventPath } from '@/lib/events'
import { buttonVariants } from '@/components/ui/button-variants'
import { EVENT_SURFACE, captureEventCardClicked } from '@/lib/analytics'
import EventTypeBadge from './EventTypeBadge'
import { EventSquareThumb } from './EventSquareThumb'

const INITIAL_VISIBLE = 6

function TimelineRow({ event }: { event: TechEvent }) {
  const { day, month } = formatEventDateBadge(event.date)

  return (
    <li>
      <a
        href={getEventPath(event.slug)}
        onClick={() =>
          captureEventCardClicked(
            event,
            EVENT_SURFACE.eventsPagePastTimeline,
            'page',
          )
        }
        className="group flex items-start gap-3 rounded-lg border border-border bg-card/80 p-2.5 text-left transition-colors duration-200 hover:border-accent/30 hover:bg-elevated/50"
      >
        <EventSquareThumb event={event} className="opacity-90" />

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="line-clamp-2 text-sm font-sans font-semibold text-primary transition-colors group-hover:text-accent">
              {event.title}
            </span>
            <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted transition-colors group-hover:text-accent" />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-2xs font-semibold uppercase tracking-wide text-muted">
              {day} {month}
            </span>
            {event.organizer && (
              <span className="truncate font-mono text-2xs text-secondary">
                {event.organizer}
              </span>
            )}
            {event.location && (
              <span className="inline-flex items-center gap-1 truncate font-mono text-2xs text-muted">
                <MapPin className="h-3 w-3 shrink-0" />
                {event.location}
              </span>
            )}
          </div>
          <div className="mt-2">
            <EventTypeBadge isInPerson={event.isInPerson} />
          </div>
        </div>
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
      <ol className="space-y-2">
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
