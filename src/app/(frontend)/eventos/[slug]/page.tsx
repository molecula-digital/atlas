import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getEventBySlug, getPublishedEvents } from '@/lib/payload'
import { eventDocToTechEvent } from '@/lib/events'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { SITE_URL } from '@/config'
import { formatDateEs } from '@/lib/format'
import { safeJsonLd } from '@/lib/utils'
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

  return (
    <article className="py-8">
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
      <div className="max-w-3xl mx-auto">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Eventos', href: '/eventos' },
            { label: event.title },
          ]}
        />

        <p className="text-sm font-mono text-muted mt-6 mb-2">
          {formatDateEs(event.date)}
        </p>
        <h1 className="text-3xl md:text-4xl font-bold text-primary mb-6">
          {event.title}
        </h1>

        <EventDetailPageClient event={event} />
      </div>
    </article>
  )
}
