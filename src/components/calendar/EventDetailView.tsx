'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
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
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { buttonVariants, type ButtonSize } from '@/components/ui/button-variants'
import { Card } from '@/components/ui/Card'
import { cn } from '@/lib/utils'
import EventTypeBadge from './EventTypeBadge'
import { AddToCalendar } from './AddToCalendar'
import { EventRichDescription } from './EventRichDescription'
import { EventDateDisplay } from './EventDateDisplay'

interface EventDetailViewProps {
  event: TechEvent
  variant?: 'modal' | 'page'
  onExpandImage?: () => void
  showLocation?: boolean
  /** When false on the full page, the details card is rendered in the sidebar instead. */
  showDetailsInline?: boolean
  /** Show the Luma-style date block (hidden on full page when rendered in the header). */
  showDateDisplay?: boolean
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

function EventHeroImage({
  event,
  isPage,
  onExpandImage,
}: {
  event: TechEvent
  isPage: boolean
  onExpandImage?: () => void
}) {
  if (!event.image) return null

  const image = (
    <>
      <img
        src={event.image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-40 blur-2xl"
      />
      <img
        src={event.image}
        alt={event.title}
        className="relative z-10 h-full w-full object-contain"
      />
      {onExpandImage && (
        <span className="absolute bottom-2 right-2 z-20 inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 font-mono text-2xs text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
          <Maximize2 size={11} />
          Ver imagen
        </span>
      )}
    </>
  )

  const containerClass = cn(
    'relative overflow-hidden bg-black/10',
    isPage
      ? 'h-56 rounded-xl border border-border md:h-80'
      : 'h-52 shrink-0 sm:h-60',
    onExpandImage && 'group cursor-pointer',
  )

  if (onExpandImage) {
    return (
      <button
        type="button"
        onClick={onExpandImage}
        className={cn(containerClass, 'w-full text-left')}
        aria-label={`Ver imagen de ${event.title}`}
      >
        {image}
      </button>
    )
  }

  return <div className={containerClass}>{image}</div>
}

export function EventDetailView({
  event,
  variant = 'modal',
  onExpandImage,
  showLocation = true,
  showDetailsInline = true,
  showDateDisplay = true,
  onClose,
}: EventDetailViewProps) {
  const isPage = variant === 'page'
  const hasImage = !!event.image

  const hero = hasImage ? (
    <EventHeroImage event={event} isPage={isPage} onExpandImage={onExpandImage} />
  ) : null

  const body = (
    <>
      {hero}

      <div
        className={cn(
          'space-y-5',
          isPage ? 'pt-1' : 'px-5 pb-5',
          hasImage && 'pt-5',
        )}
      >
        {showDateDisplay && <EventDateDisplay event={event} />}

        {event.organizer && (
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-elevated text-muted">
              <Users size={14} />
            </span>
            <div className="min-w-0">
              <p className="text-2xs font-mono uppercase tracking-wider text-muted">Organiza</p>
              <p className="text-sm font-medium text-primary">{event.organizer}</p>
            </div>
          </div>
        )}

        {showLocation && event.location && (
          <div className="flex items-start gap-2.5 text-sm text-secondary">
            <MapPin size={15} className="mt-0.5 shrink-0 text-muted" />
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

  const registerButton = event.registerUrl ? (
    <a
      href={event.registerUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={buttonVariants({
        variant: 'accent-filled',
        size: isPage ? 'lg' : size,
        className: isPage ? 'w-full justify-center sm:w-auto' : undefined,
      })}
    >
      <Ticket size={iconSize} />
      Registrarse
    </a>
  ) : null

  const actions = (
    <>
      {registerButton}
      {secondaryActions}
    </>
  )

  if (isPage) {
    return (
      <div className="space-y-5">
        {hero}

        {registerButton && <div className="flex flex-wrap gap-2">{registerButton}</div>}

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
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">{body}</div>
      <div className="flex shrink-0 flex-col flex-wrap gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center">
        {actions}
      </div>
    </div>
  )
}
