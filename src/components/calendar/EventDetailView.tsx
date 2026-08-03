'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  EVENT_SURFACE,
  captureEventLinkClicked,
  captureEventRegistrationStarted,
  captureEventViewed,
  type EventSurface,
} from '@/lib/analytics'
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
  CircleCheck,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath, isPastEventDate } from '@/lib/events'
import { SITE_URL } from '@/config'
import {
  buttonVariants,
  type ButtonSize,
} from '@/components/ui/button-variants'
import { Card } from '@/components/ui/Card'
import ShareButton from '@/components/ui/ShareButton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import { cn } from '@/lib/utils'
import EventTypeBadge from './EventTypeBadge'
import { AddToCalendar } from './AddToCalendar'
import { EventRichDescription } from './EventRichDescription'
import { EventDateDisplay } from './EventDateDisplay'
import { RegisterEventButton } from './RegisterEventButton'

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
  /** Responsive placement override for the full-page registration ticket. */
  registrationClassName?: string
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
            {event.isInPerson && <EventTypeBadge isInPerson className="ml-2" />}
          </DetailRow>
        )}
      </div>
    </EventDetailCard>
  )
}

function IconActionTooltip({
  label,
  children,
}: {
  label: string
  children: React.ReactElement
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

function ModalActionLink({
  href,
  label,
  Icon,
  onClick,
}: {
  href: string
  label: string
  Icon: LucideIcon
  onClick?: () => void
}) {
  return (
    <IconActionTooltip label={label}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onClick}
        className={buttonVariants({ size: 'icon-lg' })}
        aria-label={label}
      >
        <Icon size={16} />
      </a>
    </IconActionTooltip>
  )
}

function EventFullPageLink({
  slug,
  onClose,
  iconOnly = false,
}: {
  slug: string
  onClose?: () => void
  iconOnly?: boolean
}) {
  const router = useRouter()

  const link = (
    <Link
      href={getEventPath(slug)}
      onClick={(e) => {
        e.preventDefault()
        onClose?.()
        router.push(getEventPath(slug))
      }}
      className={buttonVariants({
        variant: 'ghost',
        size: iconOnly ? 'icon-lg' : 'md',
      })}
      aria-label={iconOnly ? 'Ver página completa' : undefined}
    >
      <Link2 size={iconOnly ? 16 : 13} />
      {!iconOnly && 'Ver página completa'}
    </Link>
  )

  return iconOnly ? (
    <IconActionTooltip label="Ver página completa">{link}</IconActionTooltip>
  ) : (
    link
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
  registrationClassName,
}: EventDetailViewProps) {
  const isPage = variant === 'page'
  const hasImage = !!event.image
  const isRegistrationDisabled = isPastEventDate(event.date)

  // The modal is the most common way an event gets read, and it never changes
  // the URL — so $pageview cannot see it. This is the only signal for it.
  const surface: EventSurface = isPage
    ? EVENT_SURFACE.detailPage
    : EVENT_SURFACE.modal

  const viewedSlug = useRef<string | null>(null)
  useEffect(() => {
    if (viewedSlug.current === event.slug) return
    viewedSlug.current = event.slug
    captureEventViewed(event, surface)
  }, [event, surface])

  const hero = hasImage ? (
    <EventHeroImage
      event={event}
      isPage={isPage}
      onExpandImage={onExpandImage}
    />
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
              <p className="text-2xs font-mono uppercase tracking-wider text-muted">
                Organiza
              </p>
              <p className="text-sm font-medium text-primary">
                {event.organizer}
              </p>
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

        {(event.descriptionRich || event.description) &&
          (event.descriptionRich ? (
            <EventRichDescription data={event.descriptionRich} />
          ) : (
            <p className="text-secondary whitespace-pre-line text-sm leading-relaxed">
              {event.description}
            </p>
          ))}
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
          onClick={() => captureEventLinkClicked(event, 'website', surface)}
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
          onClick={() => captureEventLinkClicked(event, 'maps', surface)}
          className={buttonVariants({ size })}
        >
          <Map size={iconSize} />
          Google Maps
        </a>
      )}
      <AddToCalendar event={event} size={size} surface={surface} />
      <ShareButton
        title={`${event.title} | Tech Atlas`}
        url={`${SITE_URL}${getEventPath(event.slug)}`}
        size={size}
        contentType="event"
        contentId={event.slug}
      />
      {event.meetLink && (
        <a
          href={event.meetLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => captureEventLinkClicked(event, 'meet', surface)}
          className={buttonVariants({ size })}
        >
          <Video size={iconSize} />
          Meet/Zoom
        </a>
      )}
      {!isPage && <EventFullPageLink slug={event.slug} onClose={onClose} />}
    </>
  )

  const modalActions = (
    <div
      className="flex flex-wrap items-center gap-1.5 max-sm:w-full max-sm:justify-center"
      role="group"
      aria-label="Acciones del evento"
    >
      {event.url && (
        <ModalActionLink
          href={event.url}
          label="Abrir sitio web"
          Icon={ExternalLink}
          onClick={() => captureEventLinkClicked(event, 'website', surface)}
        />
      )}
      {event.mapsUrl && (
        <ModalActionLink
          href={event.mapsUrl}
          label="Abrir en Google Maps"
          Icon={Map}
          onClick={() => captureEventLinkClicked(event, 'maps', surface)}
        />
      )}
      <AddToCalendar event={event} size="icon-lg" iconOnly surface={surface} />
      <ShareButton
        title={`${event.title} | Tech Atlas`}
        url={`${SITE_URL}${getEventPath(event.slug)}`}
        size="icon-lg"
        iconOnly
        contentType="event"
        contentId={event.slug}
      />
      {event.meetLink && (
        <ModalActionLink
          href={event.meetLink}
          label="Abrir Meet o Zoom"
          Icon={Video}
          onClick={() => captureEventLinkClicked(event, 'meet', surface)}
        />
      )}
      <EventFullPageLink slug={event.slug} onClose={onClose} iconOnly />
    </div>
  )

  if (isPage) {
    return (
      <div className="flex flex-col gap-5">
        {hero}

        <RegisterEventButton
          event={event}
          surface={surface}
          className={registrationClassName}
        />

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
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-3">
        {event.registerUrl &&
          (isRegistrationDisabled ? (
            <span
              aria-disabled="true"
              className={buttonVariants({
                variant: 'neutral',
                size: 'md',
                className: 'max-sm:w-full cursor-default text-muted',
              })}
            >
              <CircleCheck size={14} />
              Evento finalizado
            </span>
          ) : (
            <a
              href={event.registerUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => captureEventRegistrationStarted(event, surface)}
              className={buttonVariants({
                variant: 'accent-filled',
                size: 'md',
                className: 'max-sm:w-full',
              })}
            >
              <Ticket size={14} />
              Registrarse
            </a>
          ))}
        {modalActions}
      </div>
    </div>
  )
}
