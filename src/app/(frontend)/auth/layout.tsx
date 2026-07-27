import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

/** Shared shell for the auth routes (sign in / sign up) — a centered card on the page background. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <section className="flex min-h-[calc(100vh-12rem)] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-border bg-card p-8 shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
          {children}
        </div>

        <Link
          href="/"
          className="mt-6 inline-flex w-full items-center justify-center gap-1.5 font-mono text-2xs text-muted transition-colors hover:text-accent"
        >
          <ArrowLeft className="h-3 w-3" />
          Volver al inicio
        </Link>
      </div>
    </section>
  )
}
