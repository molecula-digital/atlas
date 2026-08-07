import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { syncAllEnabledLumaCalendars } from '@/lib/luma/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Luma calendars can take a while when syncing past events. */
export const maxDuration = 300

function isAuthorized(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET?.trim()
  const lumaSecret = process.env.LUMA_SYNC_SECRET?.trim()
  const expected = cronSecret || lumaSecret
  if (!expected) return false

  const auth = request.headers.get('authorization')
  if (auth === `Bearer ${expected}`) return true

  // Allow either secret via dedicated header for non-Vercel schedulers.
  const headerSecret = request.headers.get('x-luma-sync-secret')
  if (headerSecret && headerSecret === expected) return true
  if (lumaSecret && headerSecret === lumaSecret) return true

  return false
}

/**
 * Sync all enabled Luma calendars into Payload events.
 *
 * Auth: `Authorization: Bearer $CRON_SECRET` (Vercel Cron) or
 * `x-luma-sync-secret: $LUMA_SYNC_SECRET`.
 */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload = await getPayloadClient()
  const result = await syncAllEnabledLumaCalendars(payload)

  return NextResponse.json({
    ok: result.totals.failed === 0,
    ...result,
  })
}

export async function POST(request: Request) {
  return GET(request)
}
