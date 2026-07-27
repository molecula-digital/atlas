import { getPayloadClient } from '@/lib/payload'
import { NextResponse, type NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, { limit: 60, windowMs: 60 * 1000, keyPrefix: 'api-news' })
  if (limited) return limited

  try {
    const { searchParams } = request.nextUrl
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '12', 10)), 100)
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

    return NextResponse.json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    })
  } catch (error) {
    console.error('News API failed:', error)
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 })
  }
}
