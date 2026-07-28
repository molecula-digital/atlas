'use client'

import { SectionBlock } from '@/components/layout/SectionBlock'

import { CalendarRange } from 'lucide-react'
import EventCalendar from '@/components/calendar/EventCalendar'
import { SectionTitle } from '@/components/ui/SectionTitle'

export function CalendarSection() {
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
          <EventCalendar />
        </div>
      </div>
    </SectionBlock>
  )
}
