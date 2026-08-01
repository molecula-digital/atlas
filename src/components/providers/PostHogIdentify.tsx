'use client'

import { useEffect, useRef } from 'react'
import posthog from 'posthog-js'
import { useSession } from '@/lib/auth-client'
import { ANALYTICS_EVENTS } from "@/lib/analytics-events";

/**
 * Marker written by SignInButton immediately before handing off to Google.
 *
 * Sign-in is a full redirect round-trip, so the app remounts on the way back
 * and cannot tell "just authenticated" from "returned with a 7-day session"
 * by looking at the session alone. The marker is what makes `signed_in` fire
 * once per actual sign-in instead of on every page load.
 */
export const SIGN_IN_PENDING_KEY = 'atlas:sign_in_pending'

/** How recently `user.createdAt` must be to count this sign-in as a signup. */
const NEW_USER_WINDOW_MS = 2 * 60 * 1000

function isNewUser(createdAt: unknown): boolean {
  const created =
    createdAt instanceof Date
      ? createdAt
      : typeof createdAt === 'string' || typeof createdAt === 'number'
        ? new Date(createdAt)
        : null

  if (!created || Number.isNaN(created.getTime())) return false

  return Date.now() - created.getTime() < NEW_USER_WINDOW_MS
}

/** Returns the page sign-in started from, or null if this isn't a fresh sign-in. */
function takeSignInEntryPoint(): string | null {
  try {
    const entryPoint = window.sessionStorage.getItem(SIGN_IN_PENDING_KEY)
    if (entryPoint) window.sessionStorage.removeItem(SIGN_IN_PENDING_KEY)
    return entryPoint
  } catch {
    // Private-mode storage must not break identification.
    return null
  }
}

/**
 * Keeps PostHog's identity in step with the Better Auth session, and emits the
 * one sign-in conversion event the app can observe.
 *
 * Lives in the root layout rather than in a nav component: identity has to hold
 * on every route, including any that renders without the header.
 */
export function PostHogIdentify() {
  const { data: session } = useSession()
  const identifiedUserId = useRef<string | null>(null)

  useEffect(() => {
    const user = session?.user

    if (!user) {
      if (identifiedUserId.current) {
        posthog.reset()
        identifiedUserId.current = null
      }
      return
    }

    if (identifiedUserId.current === user.id) return

    // Switching accounts in the same tab: drop the previous identity first so
    // the two people don't get merged onto one distinct ID.
    if (identifiedUserId.current) {
      posthog.reset()
    }

    posthog.identify(user.id, {
      email: user.email,
      name: user.name,
    })
    identifiedUserId.current = user.id

    // Google is the only provider and the sign-in page doubles as sign-up, so
    // there is one event with a flag rather than separate signed_in/signed_up.
    const entryPoint = takeSignInEntryPoint()
    if (entryPoint) {
      posthog.capture(ANALYTICS_EVENTS.signedIn, {
        provider: 'google',
        is_new_user: isNewUser((user as { createdAt?: unknown }).createdAt),
        entry_point: entryPoint,
      })
    }
  }, [session?.user])

  return null
}
