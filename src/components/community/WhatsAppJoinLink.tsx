'use client'

import type { ReactNode } from 'react'
import { WHATSAPP_URL } from '@/config'
import {
  captureWhatsAppJoinStarted,
  type WhatsAppSurface,
} from '@/lib/analytics'

/**
 * The one way to link to the WhatsApp community.
 *
 * The link is scattered across the site — hero, footer, the CTA block on three
 * different page types — and each was previously its own anchor, so only the
 * one inside WhatsAppCta reported anything and even that conflated the three
 * pages it renders on. Routing every placement through here means the URL and
 * the reported surface cannot drift, and a new placement has to name itself.
 */
export function WhatsAppJoinLink({
  surface,
  className,
  children,
}: {
  /** Required: an unnamed placement is one we cannot tell apart later. */
  surface: WhatsAppSurface
  className?: string
  children: ReactNode
}) {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => captureWhatsAppJoinStarted(surface)}
      className={className}
    >
      {children}
    </a>
  )
}
