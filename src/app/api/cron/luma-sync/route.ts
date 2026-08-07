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
  return request.headers.get('authorization') === `Bearer ${expected}`
}

/** Sync all enabled Luma calendars. Auth: `Authorization: Bearer $CRON_SECRET`. */
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
