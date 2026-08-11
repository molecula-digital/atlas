import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { draftMode } from 'next/headers'
import { getEventBySlug, getPublishedEvents } from '@/lib/payload'
import { eventDocToTechEvent, selectOtherEvents } from '@/lib/events'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SITE_URL } from '@/config'
import { extractSocialImage, truncateMetadataText } from '@/lib/format'
import { safeJsonLd } from '@/lib/utils'
import { resolveMapEmbedUrl } from '@/lib/maps'
import { EventDetailsCard } from '@/components/calendar/EventDetailView'
import { OtherEventsSection } from '@/components/calendar/OtherEventsSection'
import { EventSidebarActions } from '@/components/calendar/EventSidebarActions'
import EventDetailPageClient from './EventDetailPageClient'
import {
  EventDetailCover,
  EventDetailIntro,
  EventDetailOrganizer,
} from './EventDetailHero'
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
  const mapEmbedUrl = event.mapsUrl
    ? await resolveMapEmbedUrl(event.mapsUrl)
    : null

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

      {/*
        Mobile order: cover → organizer/register → intro → about → actions/details.
        Desktop: left = cover + organizer + register + actions + details;
                 right = intro (title/date/ubicación) + about.
        `contents` flattens wrappers so flex `order-*` can reshuffle on small screens.
      */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
        <aside className="contents lg:sticky lg:top-14 lg:block lg:space-y-4">
          <div className="order-1 space-y-4">
            <EventDetailCover event={event} />
            <EventDetailOrganizer event={event} />
          </div>

          <div className="order-5 space-y-4">
            <EventDetailsCard
              event={event}
              showLocation={false}
              showOrganizer={false}
              className="p-4"
            />

            <EventSidebarActions
              event={event}
              showMapsLink={!mapEmbedUrl}
            />
          </div>
        </aside>

        <div className="contents lg:block lg:space-y-6">
          <div className="order-2">
            <EventDetailIntro event={event} mapEmbedUrl={mapEmbedUrl} />
          </div>

          <div className="order-3">
            <EventDetailPageClient event={event} />
          </div>
        </div>
      </div>

      <OtherEventsSection events={otherEvents} />
    </article>
  )
}
