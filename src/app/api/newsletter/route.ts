import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'
import { subscribeEmail, type NewsletterSource } from '@/lib/newsletter'
import { captureServerEvent, captureServerException } from '@/lib/posthog-server'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

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
  if (limited) {
    captureServerEvent({
      request,
      event: ANALYTICS_EVENTS.newsletterSubscriptionRejected,
      properties: { reason: 'rate_limited' },
    })
    return limited
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = subscribeSchema.safeParse(body)
  if (!parsed.success) {
    captureServerEvent({
      request,
      event: ANALYTICS_EVENTS.newsletterSubscriptionRejected,
      properties: { reason: 'invalid_email' },
    })
    return NextResponse.json(
      { error: 'Email inválido', details: parsed.error.issues },
      { status: 400 },
    )
  }

  const source = parsed.data.source as NewsletterSource

  try {
    await subscribeEmail(parsed.data.email, source)
    captureServerEvent({
      request,
      event: ANALYTICS_EVENTS.newsletterSubscriptionConfirmed,
      properties: { source },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Newsletter subscribe failed:', err)
    captureServerException({
      request,
      error: err,
      properties: { route: '/api/newsletter', source },
    })
    return NextResponse.json({ error: 'No se pudo suscribir' }, { status: 500 })
  }
}
