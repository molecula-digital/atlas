'use client'

import { Ticket, ArrowRight, CircleCheck } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TechEvent } from '@/lib/events'
import { isPastEventDate } from '@/lib/events'
import { captureEventRegistrationStarted, type EventSurface } from '@/lib/analytics'

/**
 * Primary Registrarse CTA on event pages: a compact, perforated admission
 * ticket with a tear-off stub and printed-paper details.
 *
 * Takes the whole event rather than a URL, and reports the click itself. An
 * earlier version left reporting to the caller through an optional callback,
 * and the event page — which renders this twice for its responsive layout and
 * lets CSS pick one — wired up only the copy that mobile sees. Desktop
 * registrations went uncounted, and the metric looked healthy the whole time.
 * Requiring the identity here is what makes an untracked instance impossible
 * to write.
 */
export function RegisterEventButton({
  event,
  surface,
  className,
}: {
  event: TechEvent
  /** Where this button is mounted, for discovery-path attribution. */
  surface: EventSurface
  className?: string
}) {
  const url = event.registerUrl
  const disabled = isPastEventDate(event.date)

  if (!url) return null

  const content = (
    <>
      <span className="relative z-2 flex min-w-0 flex-1 flex-col justify-center px-5 sm:px-6">
        <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.22em] opacity-70">
          {disabled ? 'Estado del evento' : 'Entrada al evento'}
        </span>
        <span className="flex items-center gap-2.5 text-base tracking-tight sm:text-lg">
          {disabled ? (
            <CircleCheck size={20} className="shrink-0" />
          ) : (
            <Ticket size={20} className="shrink-0" />
          )}
          {disabled ? 'Evento finalizado' : 'Registrarse'}
        </span>
        <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] opacity-60">
          {disabled ? 'Registro cerrado' : 'Reserva tu lugar'}
        </span>
      </span>

      <span aria-hidden className="event-cta__tear relative z-2 my-3.5 w-px shrink-0" />

      <span className="event-cta__stub relative z-2 flex w-24 shrink-0 flex-col items-center justify-center gap-2 px-3">
        {disabled ? (
          <CircleCheck size={22} aria-hidden className="opacity-70" />
        ) : (
          <span aria-hidden className="event-cta__barcode" />
        )}
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.12em]">
          {disabled ? 'Finalizado' : 'Acceder'}
          {!disabled && <ArrowRight size={13} />}
        </span>
      </span>
    </>
  )
  const classes = cn(
    'event-cta flex h-20 w-full cursor-pointer items-stretch overflow-hidden rounded-lg font-mono font-semibold whitespace-nowrap select-none outline-hidden sm:h-24',
    disabled && 'event-cta--closed cursor-default',
    className,
  )

  if (disabled) {
    return (
      <div className={classes} aria-disabled="true">
        {content}
      </div>
    )
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => captureEventRegistrationStarted(event, surface)}
      className={classes}
    >
      {content}
    </a>
  )
}
