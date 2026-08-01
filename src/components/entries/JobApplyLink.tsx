'use client'

import { ExternalLink as LinkIcon } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { captureJobApplicationStarted } from '@/lib/analytics'

/**
 * The apply CTA on a job page. A client component purely so the click can be
 * reported — leaving the external hand-off untracked would mean the job board
 * has no conversion event at all.
 */
export function JobApplyLink({
  href,
  slug,
  title,
  company,
  modality,
}: {
  href: string
  slug: string
  title: string
  company?: string | null
  modality?: string | null
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() =>
        captureJobApplicationStarted({ slug, title, company, modality })
      }
      className={buttonVariants({ variant: 'accent-filled', size: 'md' })}
    >
      <LinkIcon className="w-4 h-4" /> Aplicar
    </a>
  )
}
