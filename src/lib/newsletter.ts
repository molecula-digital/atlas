import { randomUUID } from 'crypto'
import { eq, sql } from 'drizzle-orm'
import type { Payload } from 'payload'
import { db } from '@/db'
import { profiles } from '@/db/schema/profiles'
import { user } from '@/db/schema/auth'
import { getPayloadClient } from '@/lib/payload'

export type NewsletterSource = 'homepage' | 'footer' | 'manual'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function findUserByEmail(email: string) {
  const normalized = normalizeEmail(email)
  const [row] = await db
    .select()
    .from(user)
    .where(sql`lower(${user.email}) = ${normalized}`)
    .limit(1)
  return row ?? null
}

export async function setProfileNewsletterEnabled(userId: string, enabled: boolean) {
  const now = new Date()
  await db
    .insert(profiles)
    .values({
      userId,
      newsletterEnabled: enabled,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: profiles.userId,
      set: {
        newsletterEnabled: enabled,
        updatedAt: now,
      },
    })
}

async function findSubscriberByEmail(payload: Payload, email: string) {
  const result = await payload.find({
    collection: 'newsletter-subscribers',
    where: { email: { equals: normalizeEmail(email) } },
    limit: 1,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

async function findSubscriberByToken(payload: Payload, token: string) {
  const result = await payload.find({
    collection: 'newsletter-subscribers',
    where: { unsubscribeToken: { equals: token } },
    limit: 1,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

/** Subscribe: existing auth users get profile flag; others go to anonymous list. */
export async function subscribeEmail(email: string, source: NewsletterSource) {
  const normalized = normalizeEmail(email)
  const existingUser = await findUserByEmail(normalized)

  if (existingUser) {
    await setProfileNewsletterEnabled(existingUser.id, true)
    // Keep join set clean if they previously subscribed anonymously
    await removeAnonymousSubscriber(normalized)
    return { kind: 'profile' as const }
  }

  const payload = await getPayloadClient()
  const existing = await findSubscriberByEmail(payload, normalized)
  const now = new Date().toISOString()

  if (existing) {
    await payload.update({
      collection: 'newsletter-subscribers',
      id: existing.id,
      data: {
        status: 'subscribed',
        source,
        subscribedAt: now,
        unsubscribedAt: null,
      },
      overrideAccess: true,
    })
  } else {
    await payload.create({
      collection: 'newsletter-subscribers',
      data: {
        email: normalized,
        status: 'subscribed',
        source,
        unsubscribeToken: randomUUID(),
        subscribedAt: now,
      },
      overrideAccess: true,
    })
  }

  return { kind: 'anonymous' as const }
}

/** Unsubscribe by email and/or token. Always safe to call (no enumeration). */
export async function unsubscribeNewsletter(opts: { email?: string; token?: string }) {
  const payload = await getPayloadClient()
  const now = new Date().toISOString()

  let subscriber =
    (opts.token ? await findSubscriberByToken(payload, opts.token) : null) ??
    (opts.email ? await findSubscriberByEmail(payload, opts.email) : null)

  if (subscriber) {
    await payload.update({
      collection: 'newsletter-subscribers',
      id: subscriber.id,
      data: {
        status: 'unsubscribed',
        unsubscribedAt: now,
      },
      overrideAccess: true,
    })
  }

  const email = opts.email
    ? normalizeEmail(opts.email)
    : subscriber
      ? normalizeEmail(String(subscriber.email))
      : null

  if (email) {
    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      await setProfileNewsletterEnabled(existingUser.id, false)
    }
  }
}

/** When an account is created, drop any anonymous row for that email. */
export async function removeAnonymousSubscriber(email: string) {
  const payload = await getPayloadClient()
  const existing = await findSubscriberByEmail(payload, email)
  if (!existing) return

  await payload.delete({
    collection: 'newsletter-subscribers',
    id: existing.id,
    overrideAccess: true,
  })
}

export async function buildNewsletterCsv(payload: Payload): Promise<string> {
  const anonymous = await payload.find({
    collection: 'newsletter-subscribers',
    where: { status: { equals: 'subscribed' } },
    limit: 10000,
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

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}
