'use client'

import { useEffect, useRef } from 'react'
import {
  EVENT_SURFACE,
  captureEventViewed,
} from '@/lib/analytics'
import {
  MapPin,
  Users,
  Info,
  LayoutList,
  Clock,
  CalendarDays,
  FileText,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { isLumaImportedEvent } from '@/lib/events'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import EventTypeBadge from './EventTypeBadge'
import { LumaSourceDetail } from './LumaSourceBadge'
import { EventRichDescription } from './EventRichDescription'

/** Titled section card — the entry detail pages use the same chrome. */
function EventDetailCard({
  title,
  Icon,
  children,
  className,
}: {
  title: string
  Icon: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card as="section" className={className}>
      <h2 className="font-mono text-xs text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-accent" />
        {title}
      </h2>
      {children}
    </Card>
  )
}

/** Label-above-value row, matching the entry sidebar's Detalles card. */
function DetailRow({
  label,
  Icon,
  children,
}: {
  label: string
  Icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <span className="text-sm text-muted flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-muted shrink-0" />
        {label}
      </span>
      <span className="block text-sm font-mono text-primary break-words">
        {children}
      </span>
    </div>
  )
}

export function buildEventSchedule(event: TechEvent): string {
  return event.startTime && event.endTime
    ? `${event.startTime}–${event.endTime}`
    : event.startTime || event.endTime
}

interface EventDetailsCardProps {
  event: TechEvent
  showLocation?: boolean
  showOrganizer?: boolean
  className?: string
}

/** Shared details card for the event detail sidebar. */
export function EventDetailsCard({
  event,
  showLocation = true,
  showOrganizer = true,
  className,
}: EventDetailsCardProps) {
  const schedule = buildEventSchedule(event)
  const fromLuma = isLumaImportedEvent(event)
  const hasDetails =
    (showOrganizer && !!event.organizer) ||
    !!schedule ||
    (showLocation && !!event.location) ||
    fromLuma

  if (!hasDetails) return null

  return (
    <EventDetailCard title="Detalles" Icon={LayoutList} className={className}>
      <div className="space-y-4">
        {showOrganizer && event.organizer && (
          <DetailRow label="Organiza" Icon={Users}>
            {event.organizer}
          </DetailRow>
        )}
        {schedule && (
          <DetailRow label="Horario" Icon={Clock}>
            {schedule}
          </DetailRow>
        )}
        {showLocation && event.location && (
          <DetailRow label="Ubicación" Icon={MapPin}>
            {event.location}
            {event.isInPerson && <EventTypeBadge isInPerson className="ml-2" />}
          </DetailRow>
        )}
        {fromLuma && (
          <DetailRow label="Fuente" Icon={CalendarDays}>
            <LumaSourceDetail event={event} />
          </DetailRow>
        )}
      </div>
    </EventDetailCard>
  )
}

/** About card + view analytics for the event detail page. */
export function EventDetailView({ event }: { event: TechEvent }) {
  const viewedSlug = useRef<string | null>(null)
  useEffect(() => {
    if (viewedSlug.current === event.slug) return
    viewedSlug.current = event.slug
    captureEventViewed(event, EVENT_SURFACE.detailPage)
  }, [event])

  const hasDescription = !!(event.descriptionRich || event.description)

  return (
    <EventDetailCard title="Acerca de" Icon={Info}>
      {hasDescription ? (
        event.descriptionRich ? (
          <EventRichDescription data={event.descriptionRich} />
        ) : (
          <p className="text-secondary whitespace-pre-line text-sm leading-relaxed">
            {event.description}
          </p>
        )
      ) : (
        <EmptyState
          icon={FileText}
          title="Sin descripción"
          subtitle="Este evento todavía no tiene más detalles publicados."
          className="py-10"
        />
      )}
    </EventDetailCard>
  )
}
