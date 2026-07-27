'use client'

import { useEffect, useState, type FormEvent, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { NEWSLETTER } from '@/config'
import { btn } from '@/components/ui/button-styles'

function UnsubscribeForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(
    token ? 'loading' : 'idle',
  )
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/newsletter/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        })
        if (!res.ok) throw new Error('failed')
        if (!cancelled) {
          setStatus('success')
          setMessage(NEWSLETTER.unsubscribeSuccess)
        }
      } catch {
        if (!cancelled) {
          setStatus('error')
          setMessage(NEWSLETTER.error)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [token])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setMessage(null)

    try {
      const res = await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      if (!res.ok) throw new Error('failed')
      setStatus('success')
      setMessage(NEWSLETTER.unsubscribeSuccess)
      setEmail('')
    } catch {
      setStatus('error')
      setMessage(NEWSLETTER.error)
    }
  }

  return (
    <div>
      <h1 className="terminal-title text-2xl font-sans font-bold text-primary mb-2">
        {NEWSLETTER.unsubscribeTitle}
      </h1>
      <p className="text-sm text-secondary mb-8">{NEWSLETTER.unsubscribeDescription}</p>

      {status === 'success' ? (
        <div className="flex items-start gap-2 text-sm text-accent font-mono">
          <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <p>{message}</p>
            <Link href="/" className="inline-block mt-4 text-xs text-muted hover:text-accent transition-colors">
              Volver al inicio
            </Link>
          </div>
        </div>
      ) : (
        <>
          {token && status === 'loading' && (
            <p className="flex items-center gap-2 text-sm text-muted font-mono mb-6">
              <Loader2 className="w-4 h-4 animate-spin" />
              Cancelando suscripción…
            </p>
          )}

          {(!token || status === 'error') && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <label className="text-xs font-mono text-muted uppercase tracking-wider" htmlFor="unsub-email">
                Email
              </label>
              <input
                id="unsub-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={NEWSLETTER.unsubscribeEmailPlaceholder}
                className="w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors"
                disabled={status === 'loading'}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className={btn({ variant: 'neutral', size: 'md' })}
              >
                {status === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : null}
                {NEWSLETTER.unsubscribeCta}
              </button>
            </form>
          )}

          {message && status === 'error' && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-red-400 font-mono">
              <AlertCircle className="w-3.5 h-3.5" />
              {message}
            </p>
          )}
        </>
      )}
    </div>
  )
}

export default function UnsubscribePage() {
  // Centered on the page like the auth shell — the form is short enough that
  // top-aligning it under the header leaves it stranded. The wrapper sits
  // outside Suspense so the fallback occupies the same box and nothing jumps.
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <div className="w-full max-w-md">
        <Suspense
          fallback={<p className="text-sm text-muted font-mono">Cargando…</p>}
        >
          <UnsubscribeForm />
        </Suspense>
      </div>
    </section>
  )
}
