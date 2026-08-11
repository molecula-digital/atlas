'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { CalendarDays, MapPin, ArrowRight } from 'lucide-react'
import AutoScroll from 'embla-carousel-auto-scroll'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/Carousel'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { useEventsData } from '@/hooks/useEventsData'
import type { TechEvent } from '@/hooks/useEventsData'
import {
  getEventPath,
  selectUpcomingEvents,
  formatEventDateBadge,
} from '@/lib/events'
import { EVENT_SURFACE, captureEventCardClicked } from '@/lib/analytics'
import EventTypeBadge from './EventTypeBadge'
import { LumaSourceBadge } from './LumaSourceBadge'

const UPCOMING_LIMIT = 6

function EventThumbnailCard({ ev }: { ev: TechEvent }) {
  const { day, month } = formatEventDateBadge(ev.date)

  return (
    <Link
      href={getEventPath(ev.slug)}
      onClick={() =>
        captureEventCardClicked(ev, EVENT_SURFACE.homeStrip, 'page')
      }
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-accent/40"
    >
      <div className="relative h-28 shrink-0 overflow-hidden bg-elevated">
        {ev.image ? (
          <Image
            src={ev.image}
            alt={ev.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 85vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/20 via-elevated to-card">
            <span className="text-3xl font-mono font-bold text-accent/70">
              {ev.title.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold text-primary transition-colors group-hover:text-accent">
          {ev.title}
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs font-mono text-muted">
          <span className="shrink-0 font-semibold uppercase tracking-wide text-accent">
            {day} {month}
          </span>
          {ev.startTime && (
            <span className="shrink-0 whitespace-nowrap">· {ev.startTime}</span>
          )}
          {ev.organizer && (
            <span className="truncate max-w-full">· {ev.organizer}</span>
          )}
        </div>
        {ev.location && (
          <p className="flex min-w-0 items-center gap-1 text-2xs font-mono text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{ev.location}</span>
          </p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <EventTypeBadge isInPerson={ev.isInPerson} />
          <LumaSourceBadge event={ev} />
        </div>
      </div>
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="h-28 bg-elevated animate-pulse" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-elevated animate-pulse" />
        <div className="h-3 w-1/2 rounded bg-elevated animate-pulse" />
      </div>
    </div>
  )
}

export default function UpcomingEventsStrip() {
  const { events, status } = useEventsData()

  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: 0.3,
        stopOnInteraction: true,
        stopOnMouseEnter: false,
      }),
    ],
    [],
  )

  const todayStr = new Date().toISOString().slice(0, 10)
  const upcoming = selectUpcomingEvents(events, todayStr).slice(
    0,
    UPCOMING_LIMIT,
  )

  const isLoading =
    (status === 'loading' || status === 'idle') && events.length === 0

  if (!isLoading && upcoming.length === 0) return null

  const items = isLoading
    ? Array.from({ length: 3 }).map((_, i) => ({
        key: `skeleton-${i}`,
        skeleton: true as const,
      }))
    : upcoming.map((ev) => ({
        key: ev.id,
        skeleton: false as const,
        ev,
      }))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <SectionTitle
          icon={CalendarDays}
          description="Meetups, talleres y conferencias en el ecosistema tech de Sinaloa."
        >
          Próximos eventos
        </SectionTitle>
        <Link
          href="/eventos"
          className="hidden shrink-0 items-center gap-1 pt-1 text-sm font-mono text-accent hover:underline sm:inline-flex"
        >
          Ver calendario
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Mobile carousel */}
      <div className="sm:hidden">
        <Carousel
          opts={{ align: 'start', loop: items.length > 1 }}
          plugins={items.length > 1 ? plugins : undefined}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {items.map((item) => (
              <CarouselItem
                key={item.key}
                className={`pl-3 ${items.length === 1 ? 'basis-full' : 'basis-[85%]'}`}
              >
                {item.skeleton ? (
                  <SkeletonCard />
                ) : (
                  <EventThumbnailCard ev={item.ev} />
                )}
              </CarouselItem>
            ))}
          </CarouselContent>
          {items.length > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <CarouselPrevious
                className="static min-h-11 min-w-11 translate-y-0"
                size="icon-sm"
              />
              <CarouselNext
                className="static min-h-11 min-w-11 translate-y-0"
                size="icon-sm"
              />
            </div>
          )}
        </Carousel>
        <p className="mt-4 text-center sm:hidden">
          <Link
            href="/eventos"
            className="inline-flex items-center gap-1 text-xs font-mono text-accent hover:underline"
          >
            Ver calendario
            <ArrowRight className="h-3 w-3" />
          </Link>
        </p>
      </div>

      {/* Desktop grid */}
      <div className="hidden gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) =>
          item.skeleton ? (
            <SkeletonCard key={item.key} />
          ) : (
            <EventThumbnailCard key={item.key} ev={item.ev} />
          ),
        )}
      </div>
    </div>
  )
}
