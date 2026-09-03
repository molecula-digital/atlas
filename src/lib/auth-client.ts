import { createAuthClient } from 'better-auth/react'

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (typeof window !== 'undefined' ? window.location.origin : undefined)

export const authClient = createAuthClient({
  // Client bundles inline NEXT_PUBLIC_* at build time. If the deploy build
  // omits it, use the page origin instead of localhost.
  baseURL: siteUrl || 'http://localhost:3000',
})

export const { signIn, signOut, useSession, getSession } = authClient
