'use client'

import { ExternalLink, Map, Video, Zap, type LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { SITE_URL } from '@/config'
import { EVENT_SURFACE } from '@/lib/analytics-events'
import { buttonVariants } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/Card'
import ShareButton from '@/components/ui/ShareButton'
import { AddToCalendar } from './AddToCalendar'
import { EventExternalLink } from './EventExternalLink'
import { RegisterEventButton } from './RegisterEventButton'

function ActionsCardTitle({
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
 * Register CTA + secondary actions for the event detail sidebar.
 * Keeps every instrumented action in one place so the main column stays content-only.
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
  const actionClass = buttonVariants({
    size: 'md',
    className: 'w-full justify-center',
  })

  return (
    <div className="space-y-4">
      <RegisterEventButton event={event} surface={surface} />

      <Card className="p-4">
        <ActionsCardTitle Icon={Zap}>Acciones</ActionsCardTitle>
        <div className="flex flex-col gap-2">
          <EventExternalLink
            event={event}
            linkType="website"
            surface={surface}
            className={actionClass}
          >
            <ExternalLink size={14} />
            Sitio web
          </EventExternalLink>

          {showMapsLink && (
            <EventExternalLink
              event={event}
              linkType="maps"
              surface={surface}
              className={actionClass}
            >
              <Map size={14} />
              Google Maps
            </EventExternalLink>
          )}

          <AddToCalendar
            event={event}
            size="md"
            surface={surface}
            className="w-full justify-center"
          />

          <ShareButton
            title={`${event.title} | Tech Atlas`}
            url={`${SITE_URL}${getEventPath(event.slug)}`}
            size="md"
            className="w-full justify-center"
            contentType="event"
            contentId={event.slug}
          />

          <EventExternalLink
            event={event}
            linkType="meet"
            surface={surface}
            className={actionClass}
          >
            <Video size={14} />
            Meet/Zoom
          </EventExternalLink>
        </div>
      </Card>
    </div>
  )
}
