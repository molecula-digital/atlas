'use client'

import { useState, useCallback, type FormEvent } from 'react'
import { NEWSLETTER } from '@/config'
import { useFormSubmission } from '@/hooks/useFormSubmission'
import posthog from 'posthog-js'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

export type NewsletterSignupSource = 'homepage' | 'footer'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Email state and the subscribe request. The three visual variants stay in the component. */
export function useNewsletterSignup(source: NewsletterSignupSource) {
  const [email, setEmailValue] = useState('')
  const submission = useFormSubmission({
    getErrorMessage: (err) => (err instanceof Error ? err.message : NEWSLETTER.error),
  })

  // Typing again clears a settled result so the old message doesn't linger.
  const setEmail = useCallback(
    (value: string) => {
      setEmailValue(value)
      if (submission.status === 'success' || submission.status === 'error') {
        submission.reset()
      }
    },
    [submission],
  )

  const submit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault()
      const trimmed = email.trim()
      if (!EMAIL_RE.test(trimmed)) {
        submission.fail(NEWSLETTER.invalidEmail)
        return
      }

      await submission.run(async () => {
        const res = await fetch('/api/newsletter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: trimmed, source }),
        })
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || NEWSLETTER.error)
        }
        posthog.capture(ANALYTICS_EVENTS.newsletterSubscribed, { source })
        setEmailValue('')
      })
    },
    [email, source, submission],
  )

  return {
    email,
    setEmail,
    submit,
    submitting: submission.submitting,
    succeeded: submission.succeeded,
    message: submission.succeeded ? NEWSLETTER.success : submission.error,
  }
}
