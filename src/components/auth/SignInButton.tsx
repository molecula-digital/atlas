'use client'

import { signIn } from '@/lib/auth-client'
import { buttonVariants } from '@/components/ui/button-variants'
import { SIGN_IN_PENDING_KEY } from '@/components/providers/PostHogIdentify'
import posthog from 'posthog-js'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

interface SignInButtonProps {
  callbackURL?: string
  compact?: boolean
}

function GoogleLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export function SignInButton({ callbackURL = '/dashboard', compact = false }: SignInButtonProps) {
  const handleSignIn = async () => {
    const entryPoint = window.location.pathname

    posthog.capture(ANALYTICS_EVENTS.signInStarted, {
      provider: 'google',
      entry_point: entryPoint,
      callback_url: callbackURL,
    })

    // Google takes over the tab from here, so the completion event has to be
    // emitted after we come back. This is the breadcrumb that lets us tell a
    // fresh sign-in apart from a page load on an existing session.
    try {
      window.sessionStorage.setItem(SIGN_IN_PENDING_KEY, entryPoint)
    } catch {
      // Storage can be unavailable in private mode; sign-in must still work.
    }

    await signIn.social({
      provider: 'google',
      callbackURL,
    })
  }

  if (compact) {
    return (
      <button
        onClick={handleSignIn}
        className={buttonVariants({ variant: "ghost", size: "sm" })}
      >
        <GoogleLogo className="w-3.5 h-3.5" />
        Iniciar sesión
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className={buttonVariants({ size: "md", className: "w-full" })}
    >
      <GoogleLogo className="w-5 h-5" />
      Continuar con Google
    </button>
  )
}
