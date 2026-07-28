'use client'

import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button-variants'

interface ErrorFallbackProps {
  error: Error & { digest?: string }
  reset: () => void
  title?: string
  message?: string
}

export function ErrorFallback({
  error,
  reset,
  title = 'Algo salió mal',
  message = 'Ocurrió un error inesperado. Por favor intenta de nuevo.',
}: ErrorFallbackProps) {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="flex max-w-md flex-col items-center text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
          <AlertTriangle className="h-8 w-8 text-accent" />
        </div>

        <h1 className="mb-2 font-mono text-2xl font-bold text-primary">
          {title}
        </h1>

        <p className="mb-6 text-sm text-secondary">{message}</p>

        {process.env.NODE_ENV === 'development' && error.message && (
          <pre className="mb-6 w-full overflow-x-auto rounded-lg border border-border bg-card p-4 text-left font-mono text-xs text-muted">
            {error.message}
          </pre>
        )}

        {error.digest && (
          <p className="mb-6 font-mono text-2xs text-muted">
            Referencia: {error.digest}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button onClick={reset} className={buttonVariants({ variant: 'accent', size: 'md' })}>
            Reintentar
          </button>
          <Link href="/" className={buttonVariants({ size: 'md' })}>
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
