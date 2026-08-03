/**
 * In-memory sliding window rate limiter.
 * Works per-process — suitable for single-instance deployments.
 * For multi-instance, replace with @upstash/ratelimit + Redis.
 */

import { NextResponse, type NextRequest } from 'next/server'

interface RateLimitEntry {
  tokens: number
  lastRefill: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up stale entries every 5 minutes to prevent memory leaks
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now - entry.lastRefill > 15 * 60 * 1000) {
        store.delete(key)
      }
    }
  },
  5 * 60 * 1000,
).unref()

export interface RateLimitConfig {
  limit: number
  windowMs: number
  keyPrefix: string
}

export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
): { success: boolean; remaining: number } {
  const key = `${config.keyPrefix}:${identifier}`
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now - entry.lastRefill >= config.windowMs) {
    store.set(key, { tokens: config.limit - 1, lastRefill: now })
    return { success: true, remaining: config.limit - 1 }
  }

  if (entry.tokens > 0) {
    entry.tokens--
    return { success: true, remaining: entry.tokens }
  }

  return { success: false, remaining: 0 }
}

export function getClientIp(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}

export function withRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
  userId?: string,
): NextResponse | null {
  if (process.env.RATE_LIMIT_DISABLED === 'true') return null

  const identifier = userId || getClientIp(request)
  const result = checkRateLimit(identifier, config)

  if (!result.success) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: { 'Retry-After': String(Math.ceil(config.windowMs / 1000)) },
      },
    )
  }

  return null
}
