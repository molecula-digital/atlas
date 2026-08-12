'use client'

import { useState } from 'react'
import { MapPin, Users, type LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { EVENT_SURFACE } from '@/lib/analytics-events'
import { Lightbox } from '@/components/ui/Lightbox'
import { EventCoverImage } from '@/components/calendar/EventCoverImage'
import { RegisterEventButton } from '@/components/calendar/RegisterEventButton'
import { EventDateDisplay } from '@/components/calendar/EventDateDisplay'
import { EventTimingBadge } from '@/components/calendar/EventTimingBadge'
import { EventMapDialog } from '@/components/calendar/EventMapDialog'
import EventTypeBadge from '@/components/calendar/EventTypeBadge'

/** Label + value row with a squircle icon — Organiza / Ubicación. */
function EventMetaRow({
  icon: Icon,
  label,
  children,
}: {
  icon: LucideIcon
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-elevated text-muted">
        <Icon size={16} />
      </span>
      <div className="min-w-0">
        <p className="text-2xs font-mono uppercase tracking-wider text-muted">
          {label}
        </p>
        <div className="text-sm font-medium text-primary">{children}</div>
      </div>
    </div>
  )
}

/** Square cover + lightbox for the event detail left column. */
export function EventDetailCover({ event }: { event: TechEvent }) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  if (!event.image) return null

  return (
    <>
      <EventCoverImage
        event={event}
        onExpand={() => setLightboxIndex(0)}
        className="w-full"
      />
      <Lightbox
        images={[{ src: event.image, alt: event.title }]}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}

/** Register CTA under the cover in the left column. */
export function EventDetailOrganizer({ event }: { event: TechEvent }) {
  if (!event.registerUrl) return null

  return (
    <RegisterEventButton event={event} surface={EVENT_SURFACE.detailPage} />
  )
}

/** Same chrome as Organiza; opens the map dialog when Maps data exists. */
function EventLocationMeta({
  event,
  mapEmbedUrl,
}: {
  event: TechEvent
  mapEmbedUrl: string | null
}) {
  const [mapOpen, setMapOpen] = useState(false)
  if (!event.location) return null

  const canOpenMap = Boolean(event.mapsUrl)

  return (
    <>
      <EventMetaRow icon={MapPin} label="Ubicación">
        {canOpenMap ? (
          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className="cursor-pointer text-left transition-colors hover:text-accent"
          >
            {event.location}
            <EventTypeBadge
              isInPerson={event.isInPerson}
              className="ml-2 align-middle"
            />
          </button>
        ) : (
          <>
            {event.location}
            <EventTypeBadge
              isInPerson={event.isInPerson}
              className="ml-2 align-middle"
            />
          </>
        )}
      </EventMetaRow>

      <EventMapDialog
        event={event}
        mapEmbedUrl={mapEmbedUrl}
        open={mapOpen}
        onOpenChange={setMapOpen}
      />
    </>
  )
}

/** Title, date, ubicación, and organizer for the right column. */
export function EventDetailIntro({
  event,
  mapEmbedUrl,
}: {
  event: TechEvent
  mapEmbedUrl: string | null
}) {
  return (
    <header className="flex flex-col gap-5">
      <h1 className="max-w-xl text-3xl font-bold leading-tight text-primary md:max-w-2xl md:text-4xl">
        {event.title}
      </h1>

      <div className="flex flex-col gap-3">
        <EventDateDisplay
          event={event}
          badge={<EventTimingBadge event={event} />}
        />

        <EventLocationMeta event={event} mapEmbedUrl={mapEmbedUrl} />

        {event.organizer && (
          <EventMetaRow icon={Users} label="Organiza">
            {event.organizer}
          </EventMetaRow>
        )}
      </div>
    </header>
  )
}
