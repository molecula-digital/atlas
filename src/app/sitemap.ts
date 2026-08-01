import type { MetadataRoute } from 'next'
import { getPayloadClient } from '@/lib/payload'
import { listPublicProfiles } from '@/lib/public-profile'
import { ENTRY_TYPE_CONFIG, SITE_URL, SINALOA_CITIES, type AtlasEntryType } from '@/config'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayloadClient()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/directorio`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/eventos`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/noticias`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/empleos`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE_URL}/comunidad`, changeFrequency: 'weekly', priority: 0.6 },
  ]

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = Object.values(ENTRY_TYPE_CONFIG).map((c) => ({
    url: `${SITE_URL}/${c.slug}`,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // City directory pages
  const cityPages: MetadataRoute.Sitemap = SINALOA_CITIES.map((city) => ({
    url: `${SITE_URL}/directorio/${city.id}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Entry detail pages
  const entries = await payload.find({
    collection: 'entries',
    where: { _status: { equals: 'published' } },
    limit: 1000,
    select: { slug: true, entryType: true, updatedAt: true },
  })

  const entryPages: MetadataRoute.Sitemap = entries.docs.map((entry) => {
    const categorySlug = ENTRY_TYPE_CONFIG[entry.entryType as AtlasEntryType]?.slug
    return {
      url: `${SITE_URL}/${categorySlug}/${entry.slug}`,
      lastModified: entry.updatedAt ? new Date(entry.updatedAt) : undefined,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // News articles
  const news = await payload.find({
    collection: 'news',
    where: { _status: { equals: 'published' } },
    limit: 500,
    select: { slug: true, updatedAt: true },
  })

  const newsPages: MetadataRoute.Sitemap = news.docs.map((article) => ({
    url: `${SITE_URL}/noticias/${article.slug}`,
    lastModified: article.updatedAt ? new Date(article.updatedAt) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // Job detail pages
  const jobs = await payload.find({
    collection: 'jobs',
    where: {
      _status: { equals: 'published' },
      expiresAt: { greater_than: new Date().toISOString() },
    },
    limit: 500,
    select: { slug: true, updatedAt: true },
  })

  const jobPages: MetadataRoute.Sitemap = jobs.docs.map((job) => ({
    url: `${SITE_URL}/empleos/${job.slug}`,
    lastModified: job.updatedAt ? new Date(job.updatedAt) : undefined,
    changeFrequency: 'weekly' as const,
    priority: 0.5,
  }))

  // Event detail pages. Unlike jobs, past events are not filtered out — the pages
  // stay live and keep their archival value once the date has passed.
  const events = await payload.find({
    collection: 'events',
    where: { _status: { equals: 'published' } },
    limit: 500,
    select: { slug: true, updatedAt: true },
  })

  const eventPages: MetadataRoute.Sitemap = events.docs.map((event) => ({
    url: `${SITE_URL}/eventos/${event.slug}`,
    lastModified: event.updatedAt ? new Date(event.updatedAt) : undefined,
    changeFrequency: 'monthly' as const,
    priority: 0.5,
  }))

  // Public user profiles. These live in Drizzle rather than Payload, and the
  // helper already restricts to isPublic profiles with a slug.
  const profiles = await listPublicProfiles()

  const profilePages: MetadataRoute.Sitemap = profiles.map((profile) => ({
    url: `${SITE_URL}/personas/${profile.slug}`,
    lastModified: profile.updatedAt,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  return [
    ...staticPages,
    ...categoryPages,
    ...cityPages,
    ...entryPages,
    ...newsPages,
    ...jobPages,
    ...eventPages,
    ...profilePages,
  ]
}
