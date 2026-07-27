'use client'

import { useState, type FormEvent } from 'react'
import { Loader2, CheckCircle, Mail } from 'lucide-react'
import { NEWSLETTER } from '@/config'
import { btn } from '@/components/ui/button-styles'
import { cn } from '@/lib/utils'

type NewsletterSignupVariant = 'compact' | 'section' | 'hero'
type NewsletterSignupSource = 'homepage' | 'footer'

interface NewsletterSignupProps {
  source: NewsletterSignupSource
  variant?: NewsletterSignupVariant
  className?: string
}

export function NewsletterSignup({
  source,
  variant = 'compact',
  className,
}: NewsletterSignupProps) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setMessage(null)

    const trimmed = email.trim()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus('error')
      setMessage(NEWSLETTER.invalidEmail)
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, source }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || NEWSLETTER.error)
      }
      setStatus('success')
      setMessage(NEWSLETTER.success)
      setEmail('')
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : NEWSLETTER.error)
    }
  }

  const inputClass = cn(
    'w-full px-3 py-2 rounded-lg border border-border bg-card text-primary font-mono text-sm',
    'placeholder:text-muted/50 focus:outline-hidden focus:border-accent transition-colors',
  )

  if (variant === 'section') {
    return (
      <form onSubmit={handleSubmit} className={cn('w-full', className)}>
        <div className="flex flex-col sm:flex-row gap-2">
          <label className="sr-only" htmlFor={`newsletter-email-${source}`}>
            Email
          </label>
          <input
            id={`newsletter-email-${source}`}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status !== 'idle' && status !== 'loading') setStatus('idle')
            }}
            placeholder={NEWSLETTER.placeholder}
            className={cn(inputClass, 'flex-1 bg-elevated')}
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className={btn({ variant: 'accent', size: 'md' }, 'shrink-0')}
          >
            {status === 'loading' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            {NEWSLETTER.cta}
          </button>
        </div>
        {message && (
          <p
            className={cn(
              'mt-3 text-xs font-mono flex items-center gap-1.5',
              status === 'success' ? 'text-accent' : 'text-red-400',
            )}
            role="status"
          >
            {status === 'success' && <CheckCircle className="w-3.5 h-3.5" />}
            {message}
          </p>
        )}
      </form>
    )
  }

  if (variant === 'hero') {
    return (
      <form onSubmit={handleSubmit} className={cn('w-full max-w-90', className)}>
        <label className="sr-only" htmlFor={`newsletter-email-${source}`}>
          Suscríbete al newsletter
        </label>
        <div className="flex overflow-hidden rounded-lg border border-border bg-card transition-colors focus-within:border-accent">
          <input
            id={`newsletter-email-${source}`}
            type="email"
            name="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              if (status !== 'idle' && status !== 'loading') setStatus('idle')
            }}
            placeholder={NEWSLETTER.placeholder}
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm font-mono text-primary placeholder:text-muted/50 focus:outline-hidden"
            disabled={status === 'loading'}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex w-10 shrink-0 cursor-pointer items-center justify-center border-l border-border text-accent transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed"
            aria-label={NEWSLETTER.cta}
          >
            {status === 'loading' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Mail className="h-4 w-4" />
            )}
          </button>
        </div>
        {message && (
          <p
            className={cn(
              'mt-2 flex items-center gap-1.5 text-xs font-mono',
              status === 'success' ? 'text-accent' : 'text-red-400',
            )}
            role="status"
          >
            {status === 'success' && <CheckCircle className="h-3.5 w-3.5" />}
            {message}
          </p>
        )}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-2', className)}>
      <label className="sr-only" htmlFor={`newsletter-email-${source}`}>
        Email
      </label>
      <div className="flex gap-1.5">
        <input
          id={`newsletter-email-${source}`}
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (status !== 'idle' && status !== 'loading') setStatus('idle')
          }}
          placeholder={NEWSLETTER.placeholder}
          className={cn(inputClass, 'text-xs py-1.5')}
          disabled={status === 'loading'}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={btn({ variant: 'accent', size: 'sm' }, 'shrink-0')}
          aria-label={NEWSLETTER.cta}
        >
          {status === 'loading' ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            NEWSLETTER.cta
          )}
        </button>
      </div>
      {message && (
        <p
          className={cn(
            'text-2xs font-mono',
            status === 'success' ? 'text-accent' : 'text-red-400',
          )}
          role="status"
        >
          {message}
        </p>
      )}
    </form>
  )
}
