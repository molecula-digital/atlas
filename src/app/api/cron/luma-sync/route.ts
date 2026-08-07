import { NextResponse } from 'next/server'
import { getPayloadClient } from '@/lib/payload'
import { syncAllEnabledLumaCalendars } from '@/lib/luma/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
/** Luma calendars can take a while when syncing past events. */
export const maxDuration = 300

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false

  const auth = request.headers.get('authorization')
  return auth === `Bearer ${expected}`
}

/**
 * Sync all enabled Luma calendars into Payload events.
 *
 * Auth (Coolify / host cron / manual):
 *   Authorization: Bearer $CRON_SECRET
 *
 * Example (every 6h on the VPS / Coolify Scheduled Task):
 *   curl -fsS -X POST -H "Authorization: Bearer $CRON_SECRET" \
 *     "$NEXT_PUBLIC_SITE_URL/api/cron/luma-sync"
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
