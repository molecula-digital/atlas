'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="es-MX">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#101010',
          fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
          color: '#ffffff',
        }}
      >
        <div style={{ maxWidth: 420, textAlign: 'center', padding: '0 24px' }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: '0 auto 24px',
              borderRadius: '50%',
              backgroundColor: 'rgba(66,171,122,0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#42ab7a"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              fontFamily:
                '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
              margin: '0 0 8px',
            }}
          >
            Algo salió mal
          </h1>

          <p
            style={{
              fontSize: 14,
              color: '#a1a1a1',
              margin: '0 0 24px',
              lineHeight: 1.6,
            }}
          >
            Ocurrió un error inesperado. Por favor intenta de nuevo.
          </p>

          {error.digest && (
            <p
              style={{
                fontSize: 10,
                color: '#6b6b6b',
                fontFamily:
                  '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                margin: '0 0 24px',
              }}
            >
              Referencia: {error.digest}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
            }}
          >
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontWeight: 500,
                fontFamily:
                  '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                backgroundColor: 'transparent',
                color: '#42ab7a',
                border: '1px solid rgba(66, 171, 122, 0.6)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
            <Link
              href="/"
              style={{
                padding: '8px 16px',
                fontSize: 14,
                fontFamily:
                  '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
                color: '#a1a1a1',
                backgroundColor: 'transparent',
                border: '1px solid #2f2f2f',
                borderRadius: 4,
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
