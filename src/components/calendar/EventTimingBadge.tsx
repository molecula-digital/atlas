'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import {
  getEventTimingLabel,
  type EventTimingLabel,
  type TechEvent,
} from '@/lib/events'

/**
 * Client-only "Hoy" / "En curso" chip. Sized like EventTypeBadge.
 */
export function EventTimingBadge({
  event,
  className,
}: {
  event: Pick<TechEvent, 'date' | 'startTime' | 'endTime'>
  className?: string
}) {
  const [label, setLabel] = useState<EventTimingLabel | null>(null)

  useEffect(() => {
    setLabel(getEventTimingLabel(event))
  }, [event.date, event.startTime, event.endTime])

  if (!label) return null

  return (
    <Badge
      tone={label === 'en_curso' ? 'success' : 'accent'}
      shape="square"
      className={cn('font-semibold uppercase tracking-wider', className)}
    >
      {label === 'en_curso' ? 'En curso' : 'Hoy'}
    </Badge>
  )
}
