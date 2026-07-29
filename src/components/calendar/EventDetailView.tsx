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
  Info,
  LayoutList,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { buttonVariants, type ButtonSize } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/Card'
import EventTypeBadge from './EventTypeBadge'
import { AddToCalendar } from './AddToCalendar'
import { EventRichDescription } from './EventRichDescription'

interface EventDetailViewProps {
  event: TechEvent
  variant?: 'modal' | 'page'
  onExpandImage?: () => void
  showLocation?: boolean
  /** When false on the full page, the details card is rendered in the sidebar instead. */
  showDetailsInline?: boolean
  /** Dismisses the containing dialog, when rendered inside one. */
  onClose?: () => void
}

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
  className?: string
}

/** Shared details card for modal, inline page, and sidebar layouts. */
export function EventDetailsCard({
  event,
  showLocation = true,
  className,
}: EventDetailsCardProps) {
  const schedule = buildEventSchedule(event)
  const hasDetails =
    !!event.organizer || !!schedule || (showLocation && !!event.location)

  if (!hasDetails) return null

  return (
    <EventDetailCard title="Detalles" Icon={LayoutList} className={className}>
      <div className="space-y-4">
        {event.organizer && (
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
            {event.isInPerson && (
              <EventTypeBadge isInPerson className="ml-2" />
            )}
          </DetailRow>
        )}
      </div>
    </EventDetailCard>
  )
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
      className={buttonVariants({ variant: 'ghost', size: 'md' })}
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
  showDetailsInline = true,
  onClose,
}: EventDetailViewProps) {
  const hasImage = !!event.image
  const isPage = variant === 'page'
  const schedule = buildEventSchedule(event)

  const hero = (
    <>
      {hasImage && (
        <div
          className={
            isPage
              ? 'relative h-56 md:h-72 overflow-hidden rounded-lg border border-border bg-black/10'
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
    </>
  )

  const body = (
    <>
      {hero}

      <div className={`px-5 pb-5 space-y-3 ${hasImage ? 'pt-5' : ''}`}>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {event.organizer && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <Users size={12} />
              {event.organizer}
            </span>
          )}
          {schedule && (
            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-muted">
              <Clock size={12} />
              {schedule}
            </span>
          )}
        </div>

        {showLocation && event.location && (
          <div className="flex items-start gap-2 text-sm text-secondary">
            <MapPin size={14} className="shrink-0 mt-0.5 text-muted" />
            <span>
              {event.location}
              {event.isInPerson && (
                <EventTypeBadge isInPerson className="ml-2" />
              )}
            </span>
          </div>
        )}

        {(event.descriptionRich || event.description) && (
          event.descriptionRich ? (
            <EventRichDescription data={event.descriptionRich} />
          ) : (
            <p className="text-secondary whitespace-pre-line text-sm leading-relaxed">
              {event.description}
            </p>
          )
        )}
      </div>
    </>
  )

  const size: ButtonSize = isPage ? 'lg' : 'md'
  const iconSize = isPage ? 15 : 13

  const secondaryActions = (
    <>
      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size })}
        >
          <ExternalLink size={iconSize} />
          Sitio web
        </a>
      )}
      {event.mapsUrl && (
        <a
          href={event.mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size })}
        >
          <Map size={iconSize} />
          Google Maps
        </a>
      )}
      <AddToCalendar event={event} size={size} />
      {event.meetLink && (
        <a
          href={event.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({ size })}
        >
          <Video size={iconSize} />
          Meet/Zoom
        </a>
      )}
      {!isPage && <EventFullPageLink slug={event.slug} onClose={onClose} />}
    </>
  )

  const actions = (
    <>
      {event.registerUrl && (
        <a
          href={event.registerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonVariants({
            variant: 'accent',
            size: isPage ? 'lg' : size,
            className: isPage ? 'w-full sm:w-auto' : undefined,
          })}
        >
          <Ticket size={iconSize} />
          Registrarse
        </a>
      )}
      {secondaryActions}
    </>
  )

  if (isPage) {
    return (
      <div className="space-y-4">
        {hero}

        {event.registerUrl && (
          <a
            href={event.registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({
              variant: 'accent',
              size: 'lg',
              className: 'w-full justify-center',
            })}
          >
            <Ticket size={iconSize} />
            Registrarse
          </a>
        )}

        <EventDetailCard title="Acciones" Icon={Zap}>
          <div className="flex flex-wrap gap-2">{secondaryActions}</div>
        </EventDetailCard>

        {showDetailsInline && (
          <EventDetailsCard event={event} showLocation={showLocation} />
        )}

        {(event.descriptionRich || event.description) && (
          <EventDetailCard title="Acerca de" Icon={Info}>
            {event.descriptionRich ? (
              <EventRichDescription data={event.descriptionRich} />
            ) : (
              <p className="text-secondary whitespace-pre-line text-sm leading-relaxed">
                {event.description}
              </p>
            )}
          </EventDetailCard>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="overflow-y-auto flex-1 min-h-0">{body}</div>
      <div className="flex flex-col sm:flex-row sm:items-center flex-wrap gap-2 px-5 py-4 border-t border-border shrink-0">
        {actions}
      </div>
    </div>
  )
}
