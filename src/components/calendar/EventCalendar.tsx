'use client'

import { useState, useCallback } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEventsData } from '@/hooks/useEventsData'
import type { TechEvent } from '@/hooks/useEventsData'
import { cn } from '@/lib/utils'
import {
  calendarSidebarSurface,
  calendarSurface,
  type CalendarPlacement,
} from '@/lib/analytics'
import UpcomingEventsSidebar from './UpcomingEventsSidebar'
import { EventDialog } from './EventDialog'
import { buttonVariants } from '@/components/ui/button-variants'

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

const MAX_PILLS = 2

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()

  let startWeekday = firstDay.getDay() - 1
  if (startWeekday < 0) startWeekday = 6

  return { daysInMonth, startWeekday }
}

function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 animate-pulse rounded bg-elevated" />
        <div className="h-6 w-36 animate-pulse rounded bg-elevated" />
        <div className="h-8 w-8 animate-pulse rounded bg-elevated" />
      </div>
      <div className="grid grid-cols-7 gap-1">
        {WEEKDAYS.map((day) => (
          <div key={day} className="h-4 animate-pulse rounded bg-elevated/60" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div
            key={i}
            className="min-h-14 animate-pulse rounded-md bg-elevated/40 md:min-h-20"
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Month grid + upcoming sidebar. `placement` attributes analytics for which
 * page the calendar is mounted on.
 */
export default function EventCalendar({
  placement = 'events_page',
}: {
  placement?: CalendarPlacement
}) {
  const { events, eventsByDate, status, refetch } = useEventsData()
  const gridSurface = calendarSurface(placement)
  const sidebarSurface = calendarSidebarSurface(placement)

  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const { daysInMonth, startWeekday } = getMonthDays(year, month)

  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const today = new Date()
  const todayKey =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1

  function prevMonth() {
    if (month === 0) {
      setMonth(11)
      setYear(year - 1)
    } else {
      setMonth(month - 1)
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0)
      setYear(year + 1)
    } else {
      setMonth(month + 1)
    }
  }

  function jumpToCurrentMonth() {
    const n = new Date()
    setYear(n.getFullYear())
    setMonth(n.getMonth())
  }

  /** Jump the grid to the month of an event opened from the sidebar. */
  const showEventMonth = useCallback((ev: TechEvent) => {
    const [y, m] = ev.date.split('-').map(Number)
    if (y && m) {
      setYear(y)
      setMonth(m - 1)
    }
  }, [])

  const isLoading =
    (status === 'loading' || status === 'idle') && events.length === 0

  return (
    <div className="grid lg:grid-cols-5">
      <div className="border-b border-border bg-background/40 p-4 md:p-5 lg:col-span-3 lg:border-r lg:border-b-0">
        <div className="mb-4 flex items-center justify-between gap-3">
          <button
            onClick={prevMonth}
            className={buttonVariants({ size: 'icon-md' })}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex min-w-0 items-center gap-2">
            <h3 className="truncate font-sans text-base font-bold text-primary md:text-lg">
              {MONTH_NAMES[month]}{' '}
              <span className="font-mono text-sm font-normal text-muted">
                {year}
              </span>
            </h3>
            {!isCurrentMonth && (
              <button
                onClick={jumpToCurrentMonth}
                className={buttonVariants({ variant: 'accent', size: 'sm' })}
                aria-label="Saltar a mes actual"
              >
                <CalendarDays className="h-3 w-3" />
                Hoy
              </button>
            )}
          </div>

          <button
            onClick={nextMonth}
            className={buttonVariants({ size: 'icon-md' })}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="mb-1 grid grid-cols-7 gap-1">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    'py-1 text-center font-mono text-2xs font-semibold uppercase tracking-wider md:text-xs',
                    i >= 5 ? 'text-muted/70' : 'text-muted',
                  )}
                >
                  <span className="md:hidden">{day.charAt(0)}</span>
                  <span className="hidden md:inline">{day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-14 rounded-md md:min-h-20"
                  aria-hidden
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const key = toDateKey(year, month, day)
                const dayEvents = eventsByDate[key] ?? []
                const isToday = day === todayKey
                const overflow =
                  dayEvents.length > MAX_PILLS
                    ? dayEvents.length - MAX_PILLS
                    : 0
                const dayOfWeek = (startWeekday + i) % 7
                const isWeekend = dayOfWeek >= 5
                const hasEvents = dayEvents.length > 0

                return (
                  <div
                    key={day}
                    className={cn(
                      'flex min-h-14 flex-col rounded-md p-1 transition-colors md:min-h-20 md:p-1.5',
                      isToday
                        ? 'bg-accent/10 ring-1 ring-accent/40'
                        : hasEvents
                          ? 'bg-card hover:bg-accent/5'
                          : isWeekend
                            ? 'bg-transparent'
                            : 'bg-elevated/30',
                    )}
                  >
                    <span
                      className={cn(
                        'inline-flex h-5 w-5 items-center justify-center self-start rounded-full font-mono text-2xs md:h-6 md:w-6 md:text-xs',
                        isToday
                          ? 'bg-accent font-bold text-accent-foreground'
                          : hasEvents
                            ? 'font-semibold text-primary'
                            : 'text-muted',
                      )}
                    >
                      {day}
                    </span>

                    <div className="mt-0.5 min-h-0 flex-1 space-y-0.5 md:mt-1">
                      {dayEvents.slice(0, MAX_PILLS).map((ev) => (
                        <EventDialog
                          key={ev.id}
                          event={ev}
                          surface={gridSurface}
                          className="block w-full truncate rounded-sm border-l-2 border-accent bg-accent/10 px-1 py-0.5 text-left font-mono text-[9px] text-accent transition-colors hover:bg-accent/15 md:text-2xs"
                          title={ev.title}
                        >
                          {ev.title}
                        </EventDialog>
                      ))}
                      {overflow > 0 && (
                        <span className="block px-1 font-mono text-[9px] text-muted md:text-2xs">
                          +{overflow} más
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      <UpcomingEventsSidebar
        events={events}
        status={status}
        refetch={refetch}
        onEventSelect={showEventMonth}
        surface={sidebarSurface}
      />
    </div>
  )
}
