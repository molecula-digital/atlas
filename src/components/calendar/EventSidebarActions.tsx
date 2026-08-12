'use client'

import { ExternalLink, Link2, Map, Video, type LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { SITE_URL } from '@/config'
import { EVENT_SURFACE } from '@/lib/analytics-events'
import { Card } from '@/components/ui/Card'
import ShareButton from '@/components/ui/ShareButton'
import { cn } from '@/lib/utils'
import { AddToCalendar } from './AddToCalendar'
import { EventExternalLink } from './EventExternalLink'

/** Quiet icon+label row — matches the entry detail Enlaces / Detalles sidebar. */
const sidebarActionClass = cn(
  'inline-flex h-auto w-full cursor-pointer items-center justify-start gap-2 rounded-md border-transparent bg-transparent px-0 py-1.5',
  'font-sans text-xs font-normal text-secondary shadow-none',
  'hover:border-transparent hover:bg-transparent hover:text-accent',
)

function SidebarCardTitle({
  Icon,
  children,
}: {
  Icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <h2 className="mb-4 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
      <Icon className="h-4 w-4 text-accent" />
      {children}
    </h2>
  )
}

/**
 * Secondary actions for the event detail sidebar.
 * Register lives in the Luma-style split header next to the cover.
 * Acciones uses the same card chrome and quiet rows as Detalles.
 */
export function EventSidebarActions({
  event,
  showMapsLink = true,
}: {
  event: TechEvent
  /** When false, Maps lives on the location panel instead. */
  showMapsLink?: boolean
}) {
  const surface = EVENT_SURFACE.detailPage

  return (
    <Card className="p-4">
      <SidebarCardTitle Icon={Link2}>Acciones</SidebarCardTitle>
      <div className="space-y-2">
        <EventExternalLink
          event={event}
          linkType="website"
          surface={surface}
          className={sidebarActionClass}
        >
          <ExternalLink className="h-4 w-4 shrink-0" />
          Sitio web
        </EventExternalLink>

        {showMapsLink && (
          <EventExternalLink
            event={event}
            linkType="maps"
            surface={surface}
            className={sidebarActionClass}
          >
            <Map className="h-4 w-4 shrink-0" />
            Google Maps
          </EventExternalLink>
        )}

        <AddToCalendar
          event={event}
          size="md"
          surface={surface}
          className={sidebarActionClass}
        />

        <ShareButton
          title={`${event.title} | Tech Atlas`}
          url={`${SITE_URL}${getEventPath(event.slug)}`}
          size="md"
          className={sidebarActionClass}
          contentType="event"
          contentId={event.slug}
        />

        <EventExternalLink
          event={event}
          linkType="meet"
          surface={surface}
          className={sidebarActionClass}
        >
          <Video className="h-4 w-4 shrink-0" />
          Meet/Zoom
        </EventExternalLink>
      </div>
    </Card>
  )
}
