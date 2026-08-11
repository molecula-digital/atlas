'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import {
  captureEventCardClicked,
  type EventSurface,
} from '@/lib/analytics'

/**
 * Crawlable event link that always navigates to the detail page.
 * Replaces the old modal-opening EventDialog.
 */
export function EventCardLink({
  event,
  surface,
  className,
  children,
  title,
  'aria-label': ariaLabel,
}: {
  event: TechEvent
  surface: EventSurface
  className?: string
  children: ReactNode
  title?: string
  'aria-label'?: string
}) {
  return (
    <Link
      href={getEventPath(event.slug)}
      onClick={() => captureEventCardClicked(event, surface, 'page')}
      className={className}
      title={title}
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  )
}
