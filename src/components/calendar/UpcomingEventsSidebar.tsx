import { useState, useEffect } from "react";
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
} from "lucide-react";
import EventTypeBadge from "./EventTypeBadge";
import type { TechEvent } from "@/hooks/useEventsData";
import { buttonVariants } from '@/components/ui/button-variants';
import { EventDialog } from "./EventDialog";
import { EventDateBadge } from "./EventDateBadge";
import { selectUpcomingEvents } from "@/lib/events";
import {
  captureEventRegistrationStarted,
  type EventSurface,
} from "@/lib/analytics";

const PAGE_SIZE = 3;

export default function UpcomingEventsSidebar({
  events,
  status,
  refetch,
  onEventSelect,
  surface,
}: {
  events: TechEvent[];
  status: string;
  refetch: () => void;
  /** Lets the parent calendar jump to the month of the opened event. */
  onEventSelect?: (event: TechEvent) => void;
  /** Which calendar this sidebar belongs to, for discovery-path attribution. */
  surface: EventSurface;
}) {
  const [page, setPage] = useState(0);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = selectUpcomingEvents(events, todayStr);

  const totalPages = Math.ceil(upcoming.length / PAGE_SIZE);
  const pageEvents = upcoming.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  useEffect(() => {
    setPage(0);
  }, [events.length]);

  return (
    <div className="lg:col-span-2 p-4 md:p-6 flex flex-col min-w-0">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <p className="text-2xs font-mono uppercase tracking-wider text-accent mb-1">
            // próximos
          </p>
          <h3 className="text-lg font-sans font-bold text-primary">
            Eventos destacados
          </h3>
        </div>
        <button
          onClick={refetch}
          disabled={status === "loading"}
          className={buttonVariants({ variant: "ghost", size: "icon-md", className: "text-muted shrink-0" })}
          aria-label="Actualizar eventos"
          title="Actualizar eventos"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${status === "loading" ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="space-y-2 flex-1">
        {events.length === 0 && (status === "loading" || status === "idle") ? (
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <div key={i} className="rounded-lg border border-border p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-elevated animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 rounded bg-elevated animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-elevated animate-pulse" />
              </div>
            </div>
          ))
        ) : pageEvents.length > 0 ? (
          pageEvents.map((ev, i) => {
            return (
              <EventDialog
                key={`${i}-${ev.date}-${ev.title}`}
                event={ev}
                surface={surface}
                onOpen={onEventSelect}
                aria-label={`Ver detalles: ${ev.title}`}
                className="w-full text-left rounded-lg border border-border bg-card p-3 flex items-start gap-3 transition-all duration-200 hover:border-accent/40 hover:bg-accent/5 group cursor-pointer"
              >
                <EventDateBadge date={ev.date} />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <span className="text-sm font-sans font-semibold text-primary group-hover:text-accent transition-colors line-clamp-2">
                      {ev.title}
                    </span>
                    <EventTypeBadge isInPerson={ev.isInPerson} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                    {ev.startTime && (
                      <span className="inline-flex items-center gap-1 text-2xs text-muted font-mono">
                        <Clock className="w-3 h-3 shrink-0" />
                        {ev.startTime}
                        {ev.endTime ? `–${ev.endTime}` : ""}
                      </span>
                    )}
                    {ev.location && (
                      <span className="inline-flex items-center gap-1 text-2xs text-muted font-mono truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {ev.location}
                      </span>
                    )}
                  </div>

                  {ev.organizer && (
                    <p className="text-2xs text-secondary mt-1 truncate">
                      {ev.organizer}
                    </p>
                  )}

                  {ev.registerUrl && (
                    <a
                      href={ev.registerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.stopPropagation()
                        captureEventRegistrationStarted(ev, surface)
                      }}
                      className={buttonVariants({ variant: "accent", size: "xs", className: "mt-2" })}
                    >
                      <Ticket className="w-3 h-3" />
                      Registrarse
                    </a>
                  )}
                </div>

                <ArrowRight className="w-4 h-4 shrink-0 mt-1 text-muted group-hover:text-accent transition-colors" />
              </EventDialog>
            );
          })
        ) : (
          <div className="rounded-lg border border-dashed border-border bg-elevated/40 p-8 text-center space-y-3 flex-1 flex flex-col items-center justify-center">
            <CalendarDays className="w-10 h-10 text-muted/50" />
            <p className="text-sm text-muted font-mono">Sin eventos próximos</p>
            <p className="text-xs text-secondary max-w-xs">
              ¿Conoces algún evento tech en Sinaloa? Ayúdanos a mantener el calendario actualizado.
            </p>
            <a
              href="mailto:alfonso@molecula.digital?subject=Sugerencia de evento para Tech Atlas"
              className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-accent hover:underline"
            >
              <Mail className="w-3.5 h-3.5" />
              Sugerir un evento
            </a>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-border" aria-label="Paginación de eventos">
          <button
            onClick={() => setPage((p) => p - 1)}
            disabled={page === 0}
            className={buttonVariants({ size: "icon-md" })}
            aria-label="Página anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-muted px-2">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page === totalPages - 1}
            className={buttonVariants({ size: "icon-md" })}
            aria-label="Página siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
