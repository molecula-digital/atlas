import { getEntryCounts } from '@/lib/entry-counts'
import { NextResponse, type NextRequest } from 'next/server'
import { withRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const limited = await withRateLimit(request, {
    limit: 60,
    windowMs: 60 * 1000,
    keyPrefix: 'api-entries-counts',
  })
  if (limited) return limited

  try {
    const { byCity, byType, total } = await getEntryCounts()

    return NextResponse.json({
      byCity,
      byType,
      total,
    })
  } catch (error) {
    console.error('Entries counts API failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch counts' },
      { status: 500 },
    )
  }
}
