import { getPayloadClient } from '@/lib/payload'
import { db } from '@/db'
import { sql } from 'drizzle-orm'
import { NextResponse, type NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { parsePagination, toPaginatedResponse } from '@/lib/api-route'
import type { Where } from 'payload'
import {
  listPublicProfiles,
  publicProfileToDirectoryItem,
  type PublicProfileSort,
} from '@/lib/public-profile'
import { SECTOR_OPTIONS } from '@/config'

const SORT_MAP: Record<string, string> = {
  'name-asc': 'name',
  'name-desc': '-name',
  'date-desc': '-publishDate',
  'date-asc': 'publishDate',
}

const VALID_SECTORS = new Set(SECTOR_OPTIONS.map((o) => o.value))

function parseSectors(raw: string | null): string[] {
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => VALID_SECTORS.has(s))
}

type DirectoryDoc = Record<string, unknown> & {
  id: string | number
  name?: string
  publishDate?: string | null
  kind?: string
}

function sortMerged(docs: DirectoryDoc[], sortKey: string): DirectoryDoc[] {
  const copy = [...docs]
  copy.sort((a, b) => {
    if (sortKey === 'name-asc' || sortKey === 'name-desc') {
      const cmp = String(a.name ?? '').localeCompare(
        String(b.name ?? ''),
        'es',
        { sensitivity: 'base' },
      )
      return sortKey === 'name-asc' ? cmp : -cmp
    }
    const aDate = a.publishDate ? Date.parse(String(a.publishDate)) : 0
    const bDate = b.publishDate ? Date.parse(String(b.publishDate)) : 0
    return sortKey === 'date-asc' ? aDate - bDate : bDate - aDate
  })
  return copy
}

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'api-entries',
  })
  if (limited) return limited

  try {
    const { searchParams } = request.nextUrl
    const { page, limit } = parsePagination(searchParams, { defaultLimit: 18 })
    const sortKey = searchParams.get('sort') || 'date-desc'
    const sort = SORT_MAP[sortKey] || '-publishDate'
    const entryType = searchParams.get('entryType')
    const city = searchParams.get('city')
    const sectors = parseSectors(searchParams.get('sector'))

    const where: Where = {
      _status: { equals: 'published' },
    }
    if (entryType) where.entryType = { equals: entryType }
    if (city) where.city = { equals: city }
    if (sectors.length === 1) where.sector = { equals: sectors[0] }
    else if (sectors.length > 1) where.sector = { in: sectors }

    const payload = await getPayloadClient()

    // Random sort: use SQL ORDER BY RANDOM() for efficiency
    if (sortKey === 'random') {
      const conditions = [sql`_status = 'published'`]
      if (entryType) conditions.push(sql`entry_type = ${entryType}`)
      if (city) conditions.push(sql`city = ${city}`)
      if (sectors.length === 1) {
        conditions.push(sql`sector = ${sectors[0]}`)
      } else if (sectors.length > 1) {
        conditions.push(
          sql`sector IN (${sql.join(
            sectors.map((s) => sql`${s}`),
            sql`, `,
          )})`,
        )
      }

      const whereClause = sql.join(conditions, sql` AND `)

      const result = await db.execute<{ id: number }>(
        sql`SELECT id FROM payload.entries WHERE ${whereClause} ORDER BY RANDOM() LIMIT ${limit}`,
      )

      const ids = result.rows.map((r) => r.id)

      if (ids.length === 0) {
        return NextResponse.json({
          docs: [],
          totalDocs: 0,
          totalPages: 1,
          page: 1,
          hasNextPage: false,
          hasPrevPage: false,
        })
      }

      const fullResult = await payload.find({
        collection: 'entries',
        where: { id: { in: ids } },
        limit: ids.length,
        pagination: false,
      })

      return NextResponse.json({
        docs: fullResult.docs,
        totalDocs: fullResult.docs.length,
        totalPages: 1,
        page: 1,
        hasNextPage: false,
        hasPrevPage: false,
      })
    }

    // /personas: merge Payload person entries with public user profiles (no city
    // or sector filter — profiles have neither).
    if (entryType === 'person' && !city && sectors.length === 0) {
      const profileSort = (
        ['name-asc', 'name-desc', 'date-desc', 'date-asc'].includes(sortKey)
          ? sortKey
          : 'date-desc'
      ) as PublicProfileSort

      // limit: 0 is what actually disables the cap — `pagination: false` alone
      // still applies a non-zero limit, which would silently drop person entries
      // past the cap from the merged result and its pagination.
      const entriesResult = await payload.find({
        collection: 'entries',
        where,
        limit: 0,
        pagination: false,
        sort,
      })

      let publicProfiles: Awaited<ReturnType<typeof listPublicProfiles>> = []
      try {
        publicProfiles = await listPublicProfiles(profileSort)
      } catch (err) {
        console.error(
          'Public user profiles unavailable; serving Payload persons only:',
          err,
        )
      }

      const entryDocs: DirectoryDoc[] = entriesResult.docs.map((doc) => ({
        id: doc.id,
        kind: 'entry',
        slug: doc.slug,
        name: doc.name,
        tagline: doc.tagline ?? null,
        entryType: doc.entryType,
        logo: doc.logo,
        coverImage: doc.coverImage,
        city: doc.city,
        tags: doc.tags ?? [],
        publishDate: (doc.publishDate as string | null | undefined) ?? null,
      }))

      const profileDocs: DirectoryDoc[] = publicProfiles.map((p) => {
        const item = publicProfileToDirectoryItem(p)
        return {
          ...item,
          id: item.id,
          name: item.name,
          publishDate: item.publishDate,
        }
      })

      const merged = sortMerged([...entryDocs, ...profileDocs], sortKey)
      const totalDocs = merged.length
      const totalPages = Math.max(1, Math.ceil(totalDocs / limit) || 1)
      const safePage = Math.min(page, totalPages)
      const start = (safePage - 1) * limit
      const docs = merged.slice(start, start + limit)

      return NextResponse.json({
        docs,
        totalDocs,
        totalPages,
        page: safePage,
        hasNextPage: safePage < totalPages,
        hasPrevPage: safePage > 1,
      })
    }

    const result = await payload.find({
      collection: 'entries',
      where,
      page,
      limit,
      sort,
    })

    return NextResponse.json(toPaginatedResponse(result))
  } catch (error) {
    console.error('Entries API failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch entries' },
      { status: 500 },
    )
  }
}
