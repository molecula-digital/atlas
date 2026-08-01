'use client'

import type { ReactNode } from 'react'
import type { TechEvent } from '@/lib/events'
import {
  captureEventLinkClicked,
  type EventLinkType,
  type EventSurface,
} from '@/lib/analytics'

/**
 * An outbound link off an event, reported as it is followed.
 *
 * Exists so server-rendered parts of the event page can carry the same
 * attribution as the client-rendered ones — an anchor in a server component
 * cannot capture anything on its own, and the sidebar maps link spent its
 * first release silently uncounted for exactly that reason.
 *
 * The href is derived from `linkType` rather than passed alongside it, so the
 * reported type and the URL followed cannot drift apart.
 */
export function EventExternalLink({
  event,
  linkType,
  surface,
  className,
  children,
}: {
  event: TechEvent
  linkType: EventLinkType
  surface: EventSurface
  className?: string
  children: ReactNode
}) {
  const href =
    linkType === 'maps'
      ? event.mapsUrl
      : linkType === 'meet'
        ? event.meetLink
        : event.url

  if (!href) return null

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => captureEventLinkClicked(event, linkType, surface)}
      className={className}
    >
      {children}
    </a>
  )
}
