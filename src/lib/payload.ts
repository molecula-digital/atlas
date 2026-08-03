import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { AtlasEntryType } from '@/config'

export async function getPayloadClient() {
  return getPayload({ config })
}

export const getPublishedEntries = cache(async (limit = 200) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'entries',
    where: { _status: { equals: 'published' } },
    limit,
    sort: '-publishDate',
  })
})

export const getEntriesByType = cache(
  async (entryType: AtlasEntryType, limit = 200) => {
    const payload = await getPayloadClient()
    return payload.find({
      collection: 'entries',
      where: {
        _status: { equals: 'published' },
        entryType: { equals: entryType },
      },
      limit,
      sort: '-publishDate',
    })
  },
)

export const getEntryBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'entries',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })
  return result.docs[0] ?? null
})

const CARD_SELECT = {
  slug: true,
  name: true,
  tagline: true,
  entryType: true,
  logo: true,
  coverImage: true,
  city: true,
  tags: true,
} as const

const STRIP_SELECT = {
  slug: true,
  name: true,
  tagline: true,
  entryType: true,
  logo: true,
  city: true,
} as const

export const getFeaturedEntries = cache(async () => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'entries',
    where: {
      _status: { equals: 'published' },
      featured: { equals: true },
    },
    limit: 6,
    sort: 'name',
    select: CARD_SELECT,
  })
})

export const getLatestEntries = cache(
  async (limit = 4, excludeSlugs: string[] = []) => {
    const payload = await getPayloadClient()
    const where: {
      _status: { equals: 'published' }
      slug?: { not_in: string[] }
    } = { _status: { equals: 'published' } }

    if (excludeSlugs.length > 0) {
      where.slug = { not_in: excludeSlugs }
    }

    return payload.find({
      collection: 'entries',
      where,
      limit,
      sort: '-publishDate',
      select: STRIP_SELECT,
    })
  },
)

export const getPublishedNews = cache(async (limit = 20) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'news',
    where: { _status: { equals: 'published' } },
    limit,
    sort: '-publishDate',
  })
})

export const getNewsBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'news',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })
  return result.docs[0] ?? null
})

export const getActiveJobs = cache(async (limit = 50) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'jobs',
    where: {
      _status: { equals: 'published' },
      expiresAt: { greater_than: new Date().toISOString() },
    },
    limit,
    sort: '-createdAt',
  })
})

export const getJobBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'jobs',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })
  return result.docs[0] ?? null
})

export const getPublishedEvents = cache(async (limit = 100) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'events',
    where: { _status: { equals: 'published' } },
    limit,
    sort: 'date',
  })
})

export const getEventBySlug = cache(async (slug: string) => {
  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'events',
    where: {
      slug: { equals: slug },
      _status: { equals: 'published' },
    },
    limit: 1,
  })
  return result.docs[0] ?? null
})

export const getUpcomingEvents = cache(async (limit = 5) => {
  const payload = await getPayloadClient()
  return payload.find({
    collection: 'events',
    where: {
      _status: { equals: 'published' },
      date: { greater_than_equal: new Date().toISOString().split('T')[0] },
    },
    limit,
    sort: 'date',
  })
})

/**
 * Get up to 3 suggested entries for an entry detail page.
 * Priority: same entryType > same city > any other entry.
 * Only selects card-relevant fields for efficiency.
 */
export const getSuggestedEntries = cache(
  async (entryId: string, entryType: string, city: string) => {
    const payload = await getPayloadClient()
    const TARGET = 3

    // Query 1: Same entryType, exclude current entry
    const sameTypeResult = await payload.find({
      collection: 'entries',
      where: {
        _status: { equals: 'published' },
        entryType: { equals: entryType },
        id: { not_equals: entryId },
      },
      limit: TARGET,
      select: CARD_SELECT,
    })

    const suggestions = [...sameTypeResult.docs]
    const excludeIds = [entryId, ...suggestions.map((d) => String(d.id))]

    // Query 2: Same city, exclude already-found
    if (suggestions.length < TARGET) {
      const remaining = TARGET - suggestions.length
      const sameCityResult = await payload.find({
        collection: 'entries',
        where: {
          _status: { equals: 'published' },
          city: { equals: city },
          id: { not_in: excludeIds },
        },
        limit: remaining,
        select: CARD_SELECT,
      })
      suggestions.push(...sameCityResult.docs)
      excludeIds.push(...sameCityResult.docs.map((d) => String(d.id)))
    }

    // Query 3: Any entry, exclude already-found
    if (suggestions.length < TARGET) {
      const remaining = TARGET - suggestions.length
      const fallbackResult = await payload.find({
        collection: 'entries',
        where: {
          _status: { equals: 'published' },
          id: { not_in: excludeIds },
        },
        limit: remaining,
        select: CARD_SELECT,
      })
      suggestions.push(...fallbackResult.docs)
    }

    return suggestions
  },
)
