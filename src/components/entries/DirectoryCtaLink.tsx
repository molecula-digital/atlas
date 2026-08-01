'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { captureDirectoryCtaClicked, type DirectoryCta } from '@/lib/analytics'

/**
 * A "browse the whole directory" link that reports itself.
 *
 * Exists so the home page can compare two ways of getting into the directory:
 * picking a specific entry off Destacados or Últimos registros, versus giving
 * up on the curation and going to see everything. Both sit on the same screen
 * competing for the same intent, and only measuring one of them would make the
 * other look free.
 */
export function DirectoryCtaLink({
  cta,
  href = '/directorio',
  className,
  children,
}: {
  cta: DirectoryCta
  href?: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      onClick={() => captureDirectoryCtaClicked(cta)}
      className={className}
    >
      {children}
    </Link>
  )
}
