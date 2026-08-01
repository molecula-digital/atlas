import { NextResponse, type NextRequest } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'
import { pickAllowedFields } from '@/lib/pick-allowed-fields'
import { withRateLimit } from '@/lib/rate-limit'

/** Allowlisted fields that callers may set on job submissions */
const JOB_ALLOWED_FIELDS = [
  'title', 'slug', 'description', 'type', 'modality', 'city',
  'compensation', 'tags', 'contactUrl', 'entry', 'expiresAt',
] as const

/** Fields editable via PATCH (excludes slug and expiresAt) */
const JOB_EDIT_FIELDS = [
  'title', 'description', 'type', 'modality', 'city',
  'compensation', 'tags', 'contactUrl', 'entry',
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

    // A missing id makes findByID throw; that is a 404, not a server error.
    let job
    try {
      job = await payload.findByID({ collection: 'jobs', id, draft: true })
    } catch {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!job || job.postedBy !== session.user.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    return NextResponse.json(job)
  } catch (error) {
    console.error('Job fetch failed:', error)
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = withRateLimit(request, { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'submit-job' }, session.user.id)
  if (limited) return limited

  try {
    const body = await request.json()

    if (!body.title || !body.type || !body.modality || !body.contactUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, modality, contactUrl' },
        { status: 400 },
      )
    }

    const payload = await getPayloadClient()
    const data = pickAllowedFields(body, JOB_ALLOWED_FIELDS)

    const job = await payload.create({
      collection: 'jobs',
      data: {
        ...data,
        postedBy: session.user.id,
        _status: 'draft',
      } as any,
    })
    return NextResponse.json({ success: true, id: job.id })
  } catch (error) {
    console.error('Job submission failed:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const limited = withRateLimit(request, { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'submit-job' }, session.user.id)
  if (limited) return limited

  try {
    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing job ID' }, { status: 400 })
    }

    const payload = await getPayloadClient()

    const existing = await payload.findByID({ collection: 'jobs', id, draft: true })
    if (!existing || existing.postedBy !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (existing._status !== 'draft') {
      return NextResponse.json({ error: 'Only draft jobs can be edited' }, { status: 400 })
    }

    const data = pickAllowedFields(body, JOB_EDIT_FIELDS)

    await payload.update({
      collection: 'jobs',
      id,
      data: {
        ...data,
        _status: 'draft',
      } as any,
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Job update failed:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}
