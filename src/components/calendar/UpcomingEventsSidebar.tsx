import { useState, useEffect } from 'react'
import {
  CalendarDays,
  Clock,
  MapPin,
  ArrowRight,
  RefreshCw,
  Ticket,
  ChevronLeft,
  ChevronRight,
  Mail,
} from 'lucide-react'
import EventTypeBadge from './EventTypeBadge'
import { EventSquareThumb } from './EventSquareThumb'
import type { TechEvent } from '@/hooks/useEventsData'
import { buttonVariants } from '@/components/ui/button-variants'
import { EventDialog } from './EventDialog'
import { formatEventDateBadge, selectUpcomingEvents } from '@/lib/events'
import {
  captureEventRegistrationStarted,
  type EventSurface,
} from '@/lib/analytics'

const PAGE_SIZE = 4

export default function UpcomingEventsSidebar({
  events,
  status,
  refetch,
  onEventSelect,
  surface,
}: {
  events: TechEvent[]
  status: string
  refetch: () => void
  /** Lets the parent calendar jump to the month of the opened event. */
  onEventSelect?: (event: TechEvent) => void
  /** Which calendar this sidebar belongs to, for discovery-path attribution. */
  surface: EventSurface
}) {
  const [page, setPage] = useState(0)

  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = selectUpcomingEvents(events, todayStr)

  const totalPages = Math.ceil(upcoming.length / PAGE_SIZE)
  const pageEvents = upcoming.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  useEffect(() => {
    queueMicrotask(() => setPage(0))
  }, [events.length])

  return (
    <div className="flex min-w-0 flex-col p-4 md:p-5 lg:col-span-2">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-sans text-sm font-bold text-primary">Próximos</h3>
          <p className="mt-0.5 font-mono text-2xs text-muted">
            {upcoming.length > 0
              ? `${upcoming.length} evento${upcoming.length === 1 ? '' : 's'}`
              : 'Sin fechas próximas'}
          </p>
        </div>
        <button
          onClick={refetch}
          disabled={status === 'loading'}
          className={buttonVariants({
            variant: 'ghost',
            size: 'icon-md',
            className: 'shrink-0 text-muted',
          })}
          aria-label="Actualizar eventos"
          title="Actualizar eventos"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${status === 'loading' ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {events.length === 0 && (status === 'loading' || status === 'idle') ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-3 rounded-lg border border-border p-2.5"
            >
              <div className="size-[64px] shrink-0 animate-pulse rounded-md bg-elevated" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-3/4 animate-pulse rounded bg-elevated" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-elevated" />
              </div>
            </div>
          ))
        ) : pageEvents.length > 0 ? (
          pageEvents.map((ev) => {
            const { day, month } = formatEventDateBadge(ev.date)
            return (
              <div
                key={ev.id}
                className="group relative flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2.5 text-left transition-colors duration-200 hover:border-accent/40 hover:bg-accent/5"
              >
                {/* Stretched link: covers the card so the whole thing opens the
                    dialog, without nesting the "Registrarse" anchor inside it. */}
                <EventDialog
                  event={ev}
                  surface={surface}
                  onOpen={onEventSelect}
                  className="absolute inset-0 cursor-pointer rounded-lg"
                >
                  <span className="sr-only">Ver detalles: {ev.title}</span>
                </EventDialog>

                <EventSquareThumb event={ev} />

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="line-clamp-2 text-sm font-sans font-semibold text-primary transition-colors group-hover:text-accent">
                      {ev.title}
                    </span>
                    <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted transition-colors group-hover:text-accent" />
                  </div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="font-mono text-2xs font-semibold uppercase tracking-wide text-accent">
                      {day} {month}
                    </span>
                    {ev.startTime && (
                      <span className="inline-flex items-center gap-1 font-mono text-2xs text-muted">
                        <Clock className="h-3 w-3 shrink-0" />
                        {ev.startTime}
                      </span>
                    )}
                  </div>

                  {ev.location && (
                    <span className="mt-1 inline-flex max-w-full items-center gap-1 truncate font-mono text-2xs text-muted">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {ev.location}
                    </span>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <EventTypeBadge isInPerson={ev.isInPerson} />
                    {ev.registerUrl && (
                      <a
                        href={ev.registerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() =>
                          captureEventRegistrationStarted(ev, surface)
                        }
                        className={buttonVariants({
                          variant: 'accent',
                          size: 'xs',
                          className: 'relative z-10',
                        })}
                      >
                        <Ticket className="h-3 w-3" />
                        Registrarse
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3 rounded-lg border border-dashed border-border bg-elevated/40 p-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted/50" />
            <p className="font-mono text-sm text-muted">Sin eventos próximos</p>
            <p className="max-w-xs text-xs text-secondary">
              ¿Conoces algún evento tech en Sinaloa? Ayúdanos a mantener el
              calendario actualizado.
            </p>
            <a
              href="mailto:alfonso@molecula.digital?subject=Sugerencia de evento para Tech Atlas"
              className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-accent hover:underline"
            >
              <Mail className="h-3.5 w-3.5" />
              Sugerir un evento
            </a>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav
          className="mt-4 flex items-center justify-center gap-2 border-t border-border pt-4"
          aria-label="Paginación de eventos"
        >
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className={buttonVariants({ size: 'icon-md' })}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-2 font-mono text-xs text-muted">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className={buttonVariants({ size: 'icon-md' })}
            aria-label="Página siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  )
}
