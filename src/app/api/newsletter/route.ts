import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'
import { subscribeEmail, type NewsletterSource } from '@/lib/newsletter'

const subscribeSchema = z.object({
  email: z.string().email().max(254),
  source: z.enum(['homepage', 'footer']).default('footer'),
})

export async function POST(request: NextRequest) {
  const limited = withRateLimit(request, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'newsletter-subscribe',
  })
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Email inválido', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const source = parsed.data.source as NewsletterSource

  try {
    await subscribeEmail(parsed.data.email, source)
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Newsletter subscribe failed:', err)
    return NextResponse.json({ error: 'No se pudo suscribir' }, { status: 500 })
  }
}
