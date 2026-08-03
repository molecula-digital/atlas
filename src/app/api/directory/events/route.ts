import { getPayloadClient } from '@/lib/payload'
import { NextResponse, type NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'api-events',
  })
  if (limited) return limited

  try {
    const { searchParams } = new URL(request.url)
    const payload = await getPayloadClient()
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 200)
    const result = await payload.find({
      collection: 'events',
      where: { _status: { equals: 'published' } },
      limit,
      sort: searchParams.get('sort') || 'date',
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Events API failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 },
    )
  }
}
