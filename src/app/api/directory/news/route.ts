import { getPayloadClient } from '@/lib/payload'
import { NextResponse, type NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { parsePagination, toPaginatedResponse } from '@/lib/api-route'

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, windowMs: 60 * 1000, keyPrefix: 'api-news' })
  if (limited) return limited

  try {
    const { searchParams } = request.nextUrl
    const { page, limit } = parsePagination(searchParams)
    const sortParam = searchParams.get('sort') || 'date-desc'
    const sort = sortParam === 'date-asc' ? 'publishDate' : '-publishDate'

    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'news',
      where: { _status: { equals: 'published' } },
      page,
      limit,
      sort,
    })

    return NextResponse.json(toPaginatedResponse(result))
  } catch (error) {
    console.error('News API failed:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
