import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getEventBySlug, getPublishedEvents } from '@/lib/payload'
import { eventDocToTechEvent, selectOtherEvents } from '@/lib/events'
import { EVENT_SURFACE } from '@/lib/analytics-events'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SITE_URL } from '@/config'
import { extractSocialImage, truncateMetadataText } from '@/lib/format'
import { safeJsonLd } from '@/lib/utils'
import { MapPin, ArrowUpRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { resolveMapEmbedUrl } from '@/lib/maps'
import { EventDetailsCard } from '@/components/calendar/EventDetailView'
import { EventDateDisplay } from '@/components/calendar/EventDateDisplay'
import { OtherEventsSection } from '@/components/calendar/OtherEventsSection'
import { EventExternalLink } from '@/components/calendar/EventExternalLink'
import { EventSidebarActions } from '@/components/calendar/EventSidebarActions'
import EventDetailPageClient from './EventDetailPageClient'
import { LivePreviewRefresh } from '@/components/payload/LivePreviewRefresh'

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
  const { isEnabled: isDraftMode } = await draftMode()
  const doc = await getEventBySlug(slug, isDraftMode)
  if (!doc) return { title: 'Evento no encontrado — Eventos' }

  const event = eventDocToTechEvent(doc)
  const fullDescription =
    event.description || `${event.title} — evento tech en Sinaloa`
  const description = truncateMetadataText(fullDescription, 155)
  const socialDescription = truncateMetadataText(fullDescription, 125)
  const canonical = `${SITE_URL}/eventos/${event.slug}`
  const socialImage = extractSocialImage(doc.image, event.title)

  return {
    title: `${event.title} — Eventos`,
    description,
    alternates: { canonical },
    openGraph: {
      title: event.title,
      description: socialDescription,
      url: canonical,
      ...(socialImage ? { images: [socialImage] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: event.title,
      description: socialDescription,
      ...(socialImage
        ? { images: [{ url: socialImage.url, alt: socialImage.alt }] }
        : {}),
    },
    ...(isDraftMode ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const { isEnabled: isDraftMode } = await draftMode()
  const doc = await getEventBySlug(slug, isDraftMode)
  if (!doc) notFound()

  const event = eventDocToTechEvent(doc)
  const canonical = `${SITE_URL}/eventos/${event.slug}`
  const mapEmbedUrl = event.location
    ? await resolveMapEmbedUrl(event.mapsUrl)
    : null
  const showLocationPanel = Boolean(event.location && event.mapsUrl)

  const allEvents = (await getPublishedEvents(200)).docs.map(
    eventDocToTechEvent,
  )
  const today = new Date().toISOString().slice(0, 10)
  const otherEvents = selectOtherEvents(allEvents, {
    excludeId: event.id,
    excludeSlug: event.slug,
    today,
    limit: 3,
  })

  return (
    <article>
      {isDraftMode && <LivePreviewRefresh />}
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

      <h1 className="mb-4 text-3xl font-bold text-primary md:text-4xl">
        {event.title}
      </h1>

      <EventDateDisplay event={event} className="mb-6" />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <EventDetailPageClient event={event} />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-14">
          <EventSidebarActions
            event={event}
            showMapsLink={!showLocationPanel}
          />

          <EventDetailsCard
            event={event}
            showLocation={!showLocationPanel}
            className="p-4"
          />

          {showLocationPanel && (
            <div className="overflow-hidden rounded-xl border border-border bg-card/90 shadow-sm">
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

              {mapEmbedUrl && (
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
              )}

              <div
                className={mapEmbedUrl ? 'p-3' : 'border-t border-border p-3'}
              >
                <EventExternalLink
                  event={event}
                  linkType="maps"
                  surface={EVENT_SURFACE.detailPage}
                  className={buttonVariants({
                    size: 'md',
                    className: 'w-full justify-center',
                  })}
                >
                  Abrir en Google Maps
                  <ArrowUpRight size={13} />
                </EventExternalLink>
              </div>
            </div>
          )}
        </aside>
      </div>

      <OtherEventsSection events={otherEvents} />
    </article>
  )
}
