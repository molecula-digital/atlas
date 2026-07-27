import { eq } from 'drizzle-orm'
import type { Payload } from 'payload'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { user } from '@/db/schema/auth'

export async function buildNewsletterCsv(payload: Payload): Promise<string> {
  const anonymous = await payload.find({
    collection: 'newsletter-subscribers',
    where: { status: { equals: 'subscribed' } },
    // limit: 0 disables the cap — a non-zero limit still applies under
    // `pagination: false` and would silently truncate the export.
    limit: 0,
    pagination: false,
    overrideAccess: true,
  })

  const profileRows = await db
    .select({ email: user.email })
    .from(profiles)
    .innerJoin(user, eq(profiles.userId, user.id))
    .where(eq(profiles.newsletterEnabled, true))

  const lines = ['email,source']
  const seen = new Set<string>()

  for (const doc of anonymous.docs) {
    const email = normalizeEmail(String(doc.email))
    if (seen.has(email)) continue
    seen.add(email)
    lines.push(`${escapeCsv(email)},${escapeCsv(String(doc.source ?? 'manual'))}`)
  }

  for (const row of profileRows) {
    const email = normalizeEmail(row.email)
    if (seen.has(email)) continue
    seen.add(email)
    lines.push(`${escapeCsv(email)},profile`)
  }

  return lines.join('\n') + '\n'
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
