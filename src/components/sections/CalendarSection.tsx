'use client'

import { SectionBlock } from '@/components/layout/SectionBlock'

import { CalendarRange } from 'lucide-react'
import EventCalendar from '@/components/calendar/EventCalendar'
import { SectionTitle } from '@/components/ui/SectionTitle'
import type { CalendarPlacement } from '@/lib/analytics'

/**
 * `placement` only exists for analytics: this section renders identically on the
 * home page and on /eventos, and separating those two is the point.
 */
export function CalendarSection({
  placement = 'events_page',
}: {
  placement?: CalendarPlacement
}) {
  return (
    <SectionBlock id="calendario">
      <div className="space-y-8">
        <SectionTitle
          icon={CalendarRange}
          align="center"
          description="Explora el mes y descubre meetups, talleres y conferencias en Sinaloa"
        >
          Calendario de eventos
        </SectionTitle>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <EventCalendar placement={placement} />
        </div>
      </div>
    </SectionBlock>
  )
}
