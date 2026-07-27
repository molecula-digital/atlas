'use client'

import EventCalendar from '@/components/calendar/EventCalendar'
import { SectionTitle } from '@/components/ui/SectionTitle'

export function CalendarSection() {
  return (
    <section id="calendario" className="py-8">
      <div className="space-y-8">
        <SectionTitle
          align="center"
          description="Explora el mes y descubre meetups, talleres y conferencias en Sinaloa"
        >
          Calendario de eventos
        </SectionTitle>

        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
          <EventCalendar />
        </div>
      </div>
    </section>
  )
}
