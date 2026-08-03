import { getPayloadClient } from '@/lib/payload'
import { NextResponse, type NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'
import { parsePagination, toPaginatedResponse } from '@/lib/api-route'

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'api-jobs',
  })
  if (limited) return limited

  try {
    const { searchParams } = request.nextUrl
    const { page, limit } = parsePagination(searchParams)
    const sortParam = searchParams.get('sort') || 'date-desc'
    const sort = sortParam === 'date-asc' ? 'createdAt' : '-createdAt'

    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'jobs',
      where: {
        _status: { equals: 'published' },
        expiresAt: { greater_than: new Date().toISOString() },
      },
      page,
      limit,
      sort,
    })

    return NextResponse.json(toPaginatedResponse(result))
  } catch (error) {
    console.error('Jobs API failed:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
