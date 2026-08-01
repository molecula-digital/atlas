import { PostHog } from 'posthog-node'
import type { NextRequest } from 'next/server'

/**
 * Server-side PostHog for route handlers.
 *
 * Route handlers see outcomes the browser never reports: rate-limit rejections,
 * validation failures, and 500s all look like an opaque non-ok response to the
 * client. Capturing them here is the only way those show up at all.
 *
 * Two independent decisions here, both load-bearing:
 *
 * `flushAt: 1` — send each event straight away rather than batching. Measured:
 * with background batching, an event captured seconds before SIGTERM is simply
 * lost, because Next.js exits before any shutdown hook can drain the queue.
 * Sending immediately shrinks the loss window to a single in-flight request.
 *
 * Nothing awaits the send. PostHog's docs pair `flushAt: 1` with `await
 * flush()`, but that is for serverless, where the process can freeze the moment
 * a response returns. Here it would put PostHog's round-trip inside the user's
 * request — and behind a reverse proxy, that latency is somebody's slow
 * newsletter signup. Fire-and-forget gives immediate delivery at zero cost to
 * the response.
 */

let client: PostHog | null | undefined

function getClient(): PostHog | null {
  if (client !== undefined) return client

  const projectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
  // Server traffic has no ad blockers to evade, so it goes straight to PostHog
  // rather than back out through our own reverse proxy — one less piece of
  // infrastructure between a route handler and an event it derives no benefit
  // from. Falls back to the browser host when POSTHOG_HOST is unset.
  const host = process.env.POSTHOG_HOST || process.env.NEXT_PUBLIC_POSTHOG_HOST

  if (!projectToken || !host) {
    client = null
    return client
  }

  client = new PostHog(projectToken, { host, flushAt: 1, flushInterval: 0 })
  return client
}

/**
 * The person this request belongs to.
 *
 * `X-POSTHOG-DISTINCT-ID` is attached by the browser SDK's `tracing_headers`,
 * so it already matches whatever the client identified as — including the
 * anonymous device ID for signed-out visitors, which is what keeps a newsletter
 * signup attached to the session that produced it. A signed-in user ID wins
 * because that is what `identify()` used.
 */
function getDistinctId(
  request: NextRequest,
  userId?: string | null,
): string | null {
  if (userId) return userId

  const header = request.headers.get('x-posthog-distinct-id')
  return header && header.trim() !== '' ? header : null
}

function getSessionId(request: NextRequest): string | undefined {
  const header = request.headers.get('x-posthog-session-id')
  return header && header.trim() !== '' ? header : undefined
}

/**
 * Queue a server-side event. Returns immediately and never throws — analytics
 * must not be able to fail, slow, or break a request that otherwise succeeded.
 */
export function captureServerEvent({
  request,
  userId,
  event,
  properties,
}: {
  request: NextRequest
  userId?: string | null
  event: string
  properties?: Record<string, unknown>
}): void {
  const posthog = getClient()
  if (!posthog) return

  const distinctId = getDistinctId(request, userId)
  // Without an ID the event would belong to nobody and pollute the person list.
  if (!distinctId) return

  const sessionId = getSessionId(request)

  try {
    posthog.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        ...(sessionId ? { $session_id: sessionId } : {}),
      },
    })
  } catch (error) {
    console.error('PostHog server capture failed:', error)
  }
}

/** Report a server-side exception, tied to the requesting person when known. */
export function captureServerException({
  request,
  userId,
  error,
  properties,
}: {
  request: NextRequest
  userId?: string | null
  error: unknown
  properties?: Record<string, unknown>
}): void {
  const posthog = getClient()
  if (!posthog) return

  const distinctId = getDistinctId(request, userId) ?? undefined

  try {
    posthog.captureException(
      error instanceof Error ? error : new Error(String(error)),
      distinctId,
      properties,
    )
  } catch (captureError) {
    console.error('PostHog server exception capture failed:', captureError)
  }
}

