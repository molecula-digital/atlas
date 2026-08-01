import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'
import { pickAllowedFields } from '@/lib/pick-allowed-fields'
import { withRateLimit } from '@/lib/rate-limit'

/** Allowlisted fields that callers may set on entry submissions */
const ENTRY_ALLOWED_FIELDS = [
  'entryType', 'name', 'slug', 'tagline', 'city', 'state', 'country',
  'logo', 'coverImage', 'tags', 'website', 'x', 'instagram', 'linkedin',
  'github', 'youtube', 'publishDate', 'body', 'foundedYear', 'stage',
  'teamSize', 'sector', 'technologies', 'hiringUrl',
  'businessModel', 'memberCount', 'meetupFrequency', 'discord', 'telegram',
  'role', 'company', 'availableForHire',
  'availableForMentoring', 'email', 'portfolio',
] as const

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = request.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 })
  }

  try {
    const payload = await getPayloadClient()

    let entry
    try {
      entry = await payload.findByID({ collection: 'entries', id, draft: true })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!entry || entry.owner !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(entry)
  } catch (error) {
    console.error('Entry fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch entry' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = withRateLimit(request, { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'submit-entry' }, session.user.id)
  if (limited) return limited

  try {
    const body = await request.json()

    if (!body.entryType || !body.name || !body.city) {
      return NextResponse.json(
        { error: 'Missing required fields: entryType, name, city' },
        { status: 400 },
      )
    }

    const payload = await getPayloadClient()
    const data = pickAllowedFields(body, ENTRY_ALLOWED_FIELDS)

    const entry = await payload.create({
      collection: 'entries',
      data: {
        ...data,
        owner: session.user.id,
        _status: 'draft',
      } as any,
    })
    return NextResponse.json({ success: true, id: entry.id })
  } catch (error) {
    console.error('Entry submission failed:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = withRateLimit(request, { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'submit-entry' }, session.user.id)
  if (limited) return limited

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing entry ID' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    const existing = await payload.findByID({ collection: 'entries', id, draft: true })
    if (!existing || existing.owner !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const data = pickAllowedFields(body, ENTRY_ALLOWED_FIELDS)

    await payload.update({
      collection: 'entries',
      id,
      data: {
        ...data,
        _status: 'draft',
      } as any,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Entry update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
