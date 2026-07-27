import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getPublishedEvents } from '@/lib/payload'
import { eventDocToTechEvent } from '@/lib/events'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SITE_URL } from '@/config'
import { formatDateEs } from '@/lib/format'
import { safeJsonLd } from '@/lib/utils'
import { MapPin, ArrowUpRight } from 'lucide-react'
import { btn } from '@/components/ui/button-styles'
import EventDetailPageClient from './EventDetailPageClient'

export const revalidate = 3600

export async function generateStaticParams() {
  const result = await getPublishedEvents(200)
  return result.docs.map((event) => ({ slug: event.slug as string }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const doc = await getEventBySlug(slug)
  if (!doc) return { title: 'Not Found' }

  const event = eventDocToTechEvent(doc)
  const description = event.description || `${event.title} — evento tech en Sinaloa`
  const canonical = `${SITE_URL}/eventos/${event.slug}`

  return {
    title: `${event.title} — Eventos`,
    description,
    alternates: { canonical },
    openGraph: {
      title: event.title,
      description,
      url: canonical,
      ...(event.image ? { images: [{ url: event.image }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const doc = await getEventBySlug(slug)
  if (!doc) notFound()

  const event = eventDocToTechEvent(doc)
  const canonical = `${SITE_URL}/eventos/${event.slug}`
  const mapEmbedUrl = event.mapsUrl && event.location
    ? `https://www.google.com/maps?${new URLSearchParams({
        q: event.location,
        output: 'embed',
      }).toString()}`
    : null

  return (
    <article className="py-4">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            '@context': 'https://schema.org',
            '@type': 'Event',
            name: event.title,
            description: event.description || undefined,
            startDate: event.startTime
              ? `${event.date}T${event.startTime}`
              : event.date,
            endDate: event.endTime
              ? `${event.date}T${event.endTime}`
              : undefined,
            eventAttendanceMode:
              event.modality === 'online'
                ? 'https://schema.org/OnlineEventAttendanceMode'
                : event.modality === 'hybrid'
                  ? 'https://schema.org/MixedEventAttendanceMode'
                  : 'https://schema.org/OfflineEventAttendanceMode',
            eventStatus: 'https://schema.org/EventScheduled',
            location: event.location
              ? {
                  '@type': 'Place',
                  name: event.location,
                  ...(event.mapsUrl ? { url: event.mapsUrl } : {}),
                }
              : undefined,
            organizer: event.organizer
              ? { '@type': 'Organization', name: event.organizer }
              : undefined,
            image: event.image || undefined,
            url: event.url || canonical,
          }),
        }}
      />
      <Breadcrumb
        items={[
          { label: 'Inicio', href: '/' },
          { label: 'Eventos', href: '/eventos' },
          { label: event.title },
        ]}
      />

      <div
        className={
          mapEmbedUrl
            ? 'grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]'
            : undefined
        }
      >
        <div className="min-w-0">
          <p className="mb-2 text-sm font-mono text-muted">
            {formatDateEs(event.date)}
          </p>
          <h1 className="mb-6 text-3xl font-bold text-primary md:text-4xl">
            {event.title}
          </h1>
          <EventDetailPageClient event={event} showLocation={!mapEmbedUrl} />
        </div>

        {mapEmbedUrl && (
          <aside className="overflow-hidden rounded-xl border border-border bg-card/90 shadow-sm lg:sticky lg:top-14">
            <div className="flex items-start gap-3 p-4">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent/20 bg-accent/10 text-accent">
                <MapPin size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-2xs font-mono uppercase tracking-wider text-muted">
                  Ubicación
                </p>
                <p className="mt-1 text-sm leading-snug text-primary">
                  {event.location}
                </p>
              </div>
            </div>

            <div className="h-52 border-y border-border bg-elevated">
              <iframe
                src={mapEmbedUrl}
                title={`Mapa de ${event.location}`}
                className="h-full w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>

            <div className="p-3">
              <a
                href={event.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={btn({ size: 'md' }, 'w-full justify-center')}
              >
                Abrir en Google Maps
                <ArrowUpRight size={13} />
              </a>
            </div>
          </aside>
        )}
      </div>
    </article>
  )
}
