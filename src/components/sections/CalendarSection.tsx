'use client'

import { SectionBlock } from '@/components/layout/SectionBlock'
import EventCalendar from '@/components/calendar/EventCalendar'
import type { CalendarPlacement } from '@/lib/analytics'

/**
 * `placement` only exists for analytics: this section used to render on home
 * and /eventos; home dropped it, but the prop stays so surfaces stay distinct
 * if the calendar is remounted elsewhere.
 */
export function CalendarSection({
  placement = 'events_page',
}: {
  placement?: CalendarPlacement
}) {
  return (
    <SectionBlock id="calendario" className="pt-0">
      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <EventCalendar placement={placement} />
      </div>
    </SectionBlock>
  )
}
