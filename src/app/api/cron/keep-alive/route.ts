import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '@/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function isAuthorized(request: Request): boolean {
  const expected = process.env.CRON_SECRET?.trim()
  if (!expected) return false
  return request.headers.get('authorization') === `Bearer ${expected}`
}

const NO_STORE = { 'Cache-Control': 'no-store' }

/**
 * Touches Neon so the compute does not suspend. Auth:
 * `Authorization: Bearer $CRON_SECRET`.
 */
async function handle(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401, headers: NO_STORE },
    )
  }

  await db.execute(sql`select 1 as ok`)

  return NextResponse.json({ ok: true }, { headers: NO_STORE })
}

export async function GET(request: Request) {
  return handle(request)
}

export async function POST(request: Request) {
  return handle(request)
}
