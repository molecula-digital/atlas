'use client'

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, ArrowRight, ArrowUpRight } from "lucide-react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from "@/components/ui/Carousel";
import { useEventsData } from "@/hooks/useEventsData";
import type { TechEvent } from "@/hooks/useEventsData";
import { getEventPath, selectUpcomingEvents } from "@/lib/events";
import { EventDateBadge } from "./EventDateBadge";
import EventTypeBadge from "./EventTypeBadge";

function EventCard({ ev }: { ev: TechEvent }) {
  return (
    <a
      href={getEventPath(ev.slug)}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full h-full bg-card border border-border rounded-lg p-3 flex items-center gap-3 text-left transition-all duration-200 hover:border-accent/40 hover:shadow-sm cursor-pointer group"
    >
      <EventDateBadge date={ev.date} />

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-sans font-semibold text-primary group-hover:text-accent transition-colors truncate">
            {ev.title}
          </span>
          <span className="shrink-0">
            <EventTypeBadge isInPerson={ev.isInPerson} />
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 overflow-hidden">
          {ev.organizer && (
            <span className="text-xs font-mono text-muted truncate min-w-0">
              {ev.organizer}
            </span>
          )}
          {ev.startTime && (
            <span className="text-xs font-mono text-muted shrink-0 whitespace-nowrap">
              · {ev.startTime}
            </span>
          )}
        </div>
        {ev.location && (
          <span className="inline-flex items-center gap-1 text-2xs font-mono text-muted mt-0.5 truncate max-w-full">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            {ev.location}
          </span>
        )}
      </div>

      {/* Opens in a new tab */}
      <ArrowUpRight className="w-4 h-4 text-muted group-hover:text-accent transition-colors shrink-0" />
    </a>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-lg p-3 flex items-center gap-3">
      <div className="w-12 h-12 rounded-lg bg-elevated animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded bg-elevated animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-elevated animate-pulse" />
      </div>
    </div>
  );
}

export default function UpcomingEventsStrip() {
  const { events, status } = useEventsData();

  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: 0.3,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
      }),
    ],
    [],
  );

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = selectUpcomingEvents(events, todayStr).slice(0, 3);

  const isLoading = (status === "loading" || status === "idle") && events.length === 0;

  if (!isLoading && upcoming.length === 0) return null;

  const items = isLoading
    ? Array.from({ length: 3 }).map((_, i) => ({
        key: `skeleton-${i}`,
        skeleton: true as const,
      }))
    : upcoming.map((ev, i) => ({
        key: `${i}-${ev.date}-${ev.title}`,
        skeleton: false as const,
        ev,
      }));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-mono font-semibold text-muted tracking-wide uppercase">
            Próximos eventos
          </h2>
        </div>
        <a
          href="#calendario"
          onClick={(e) => {
            e.preventDefault();
            document
              .querySelector("#calendario")
              ?.scrollIntoView({ behavior: "smooth" });
          }}
          className="inline-flex items-center gap-1 text-xs font-mono font-medium text-accent hover:underline"
        >
          Ver calendario
          <ArrowRight className="w-3 h-3" />
        </a>
      </div>

      {/* Mobile carousel */}
      <div className="sm:hidden">
        <Carousel
          opts={{ align: "start", loop: true }}
          plugins={plugins}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {items.map((item) => (
              <CarouselItem key={item.key} className={`pl-3 ${items.length === 1 ? "basis-full" : "basis-[85%]"}`}>
                {item.skeleton ? <SkeletonCard /> : <EventCard ev={item.ev} />}
              </CarouselItem>
            ))}
          </CarouselContent>
          <div className="flex items-center justify-center gap-2 mt-4">
            <CarouselPrevious
              className="static translate-y-0 min-h-11 min-w-11"
              size="icon-sm"
            />
            <CarouselNext
              className="static translate-y-0 min-h-11 min-w-11"
              size="icon-sm"
            />
          </div>
        </Carousel>
      </div>

      {/* Desktop grid */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {items.map((item) =>
          item.skeleton ? (
            <SkeletonCard key={item.key} />
          ) : (
            <EventCard key={item.key} ev={item.ev} />
          ),
        )}
      </div>
    </div>
  );
}
