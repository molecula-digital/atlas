'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Clock,
  MapPin,
  Users,
  ExternalLink,
  Map,
  Video,
  Ticket,
  Maximize2,
  Link2,
} from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { btn } from '@/components/ui/button-styles'
import { AddToCalendar } from './AddToCalendar'

interface EventDetailViewProps {
  event: TechEvent
  variant?: 'modal' | 'page'
  onExpandImage?: () => void
  showLocation?: boolean
  /** Dismisses the containing dialog, when rendered inside one. */
  onClose?: () => void
}

function EventFullPageLink({ slug, onClose }: { slug: string; onClose?: () => void }) {
  const router = useRouter()

  return (
    <Link
      href={getEventPath(slug)}
      onClick={(e) => {
        e.preventDefault()
        onClose?.()
        router.push(getEventPath(slug))
      }}
      className={btn({ variant: 'ghost', size: 'md' })}
    >
      <Link2 size={13} />
      Ver página completa
    </Link>
  )
}

export function EventDetailView({
  event,
  variant = 'modal',
  onExpandImage,
  showLocation = true,
  onClose,
}: EventDetailViewProps) {
  const hasImage = !!event.image
  const isPage = variant === 'page'

  const body = (
    <>
      {hasImage && (
        <div
          className={
            isPage
              ? 'relative mb-6 h-56 md:h-72 overflow-hidden rounded-lg bg-black/10'
              : 'relative h-48 overflow-hidden shrink-0 bg-black/10'
          }
        >
          <img
            src={event.image!}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-40"
          />
          <img
            src={event.image!}
            alt={event.title}
            className="relative z-10 w-full h-full object-contain"
          />
          {onExpandImage && (
            <button
              type="button"
              onClick={onExpandImage}
              className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1.5 text-2xs font-mono px-2 py-1 rounded-md bg-black/60 text-white hover:bg-black/80 transition-colors backdrop-blur-sm"
            >
              <Maximize2 size={11} />
              Ver imagen
            </button>
          )}
        </div>
      )}

      <div className={isPage ? 'space-y-4' : 'px-5 pb-5 space-y-3'}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {event.organizer && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <Users size={12} />
              {event.organizer}
            </span>
          )}
          {(event.startTime || event.endTime) && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <Clock size={12} />
              {event.startTime && event.endTime
                ? `${event.startTime}–${event.endTime}`
                : event.startTime || event.endTime}
            </span>
          )}
        </div>

        {showLocation && event.location && (
          <div className="flex items-start gap-2 text-sm text-secondary">
            <MapPin size={14} className="shrink-0 mt-0.5 text-muted" />
            <span>
              {event.location}
              {event.isInPerson && (
                <span className="ml-2 inline-block text-2xs font-mono font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-accent/15 text-accent">
                  Presencial
                </span>
              )}
            </span>
          </div>
        )}

        {event.description && (
          <p className="text-secondary whitespace-pre-line text-sm leading-relaxed">
            {event.description}
          </p>
        )}
      </div>
    </>
  )

  const footer = (
    <div
      className={
        isPage
          ? 'flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 pt-4 border-t border-border'
          : 'flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 px-5 py-4 border-t border-border shrink-0'
      }
    >
      {event.registerUrl && (
        <a
          href={event.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btn({ variant: 'accent', size: 'md' })}
        >
          <Ticket size={13} />
          Registrarse
        </a>
      )}
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className={btn({ size: 'md' })}
        >
          <ExternalLink size={13} />
          Sitio web
        </a>
      )}
      {event.mapsUrl && (
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={btn({ size: 'md' })}
        >
          <Map size={13} />
          Google Maps
        </a>
      )}
      <AddToCalendar event={event} />
      {event.meetLink && (
        <a
          href={event.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={btn({ size: 'md' })}
        >
          <Video size={13} />
          Meet/Zoom
        </a>
      )}
      {!isPage && <EventFullPageLink slug={event.slug} onClose={onClose} />}
    </div>
  )

  if (isPage) {
    return (
      <div className="space-y-6">
        {body}
        {footer}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="overflow-y-auto flex-1 min-h-0">{body}</div>
      {footer}
    </div>
  )
}
