import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { withRateLimit } from '@/lib/rate-limit'
import { unsubscribeNewsletter } from '@/lib/newsletter'

const unsubscribeSchema = z
  .object({
    email: z.string().email().max(254).optional(),
    token: z.string().min(8).max(128).optional(),
  })
  .refine((data) => Boolean(data.email || data.token), {
    message: 'email or token required',
  })

export async function POST(request: NextRequest) {
  const limited = withRateLimit(request, {
    limit: 20,
    windowMs: 15 * 60 * 1000,
    keyPrefix: 'newsletter-unsubscribe',
  })
  if (limited) return limited

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = unsubscribeSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
  }

  try {
    await unsubscribeNewsletter(parsed.data)
    // Same response whether or not the email/token existed
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Newsletter unsubscribe failed:', err)
    return NextResponse.json(
      { error: 'No se pudo cancelar la suscripción' },
      { status: 500 },
    )
  }
}
