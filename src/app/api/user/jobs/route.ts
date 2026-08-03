import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'
import { withRateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = withRateLimit(
    request,
    { limit: 30, windowMs: 60 * 1000, keyPrefix: 'user-jobs' },
    session.user.id,
  )
  if (limited) return limited

  try {
    const payload = await getPayloadClient()
    const result = await payload.find({
      collection: 'jobs',
      where: { postedBy: { equals: session.user.id } },
      limit: 50,
      sort: '-updatedAt',
      draft: true,
      select: {
        title: true,
        type: true,
        modality: true,
        city: true,
        slug: true,
        _status: true,
        moderationNote: true,
        expiresAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('User jobs fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 })
  }
}
