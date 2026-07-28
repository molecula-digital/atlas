'use client'

import { useState, useCallback } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { useEventsData } from "@/hooks/useEventsData";
import type { TechEvent } from "@/hooks/useEventsData";
import { cn } from "@/lib/utils";
import UpcomingEventsSidebar from "./UpcomingEventsSidebar";
import { EventDialog } from "./EventDialog";
import { buttonVariants } from '@/components/ui/button-variants';

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const MAX_PILLS = 2;

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  let startWeekday = firstDay.getDay() - 1;
  if (startWeekday < 0) startWeekday = 6;

  return { daysInMonth, startWeekday };
}

function CalendarSkeleton() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="h-8 w-8 rounded bg-elevated animate-pulse" />
        <div className="h-6 w-36 rounded bg-elevated animate-pulse" />
        <div className="h-8 w-8 rounded bg-elevated animate-pulse" />
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((day) => (
          <div key={day} className="h-4 rounded bg-elevated/60 animate-pulse" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="min-h-16 md:min-h-24 rounded-lg bg-elevated/40 animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export default function EventCalendar() {
  const { events, eventsByDate, status, refetch } = useEventsData();

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const { daysInMonth, startWeekday } = getMonthDays(year, month);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const today = new Date();
  const todayKey =
    today.getFullYear() === year && today.getMonth() === month
      ? today.getDate()
      : -1;

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear(year - 1);
    } else {
      setMonth(month - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear(year + 1);
    } else {
      setMonth(month + 1);
    }
  }

  function jumpToCurrentMonth() {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth());
  }

  /** Jump the grid to the month of an event opened from the sidebar. */
  const showEventMonth = useCallback((ev: TechEvent) => {
    const [y, m] = ev.date.split("-").map(Number);
    if (y && m) {
      setYear(y);
      setMonth(m - 1);
    }
  }, []);

  const isLoading = (status === "loading" || status === "idle") && events.length === 0;

  return (
    <div className="grid lg:grid-cols-5">
      <div className="lg:col-span-3 p-4 md:p-6 border-b lg:border-b-0 lg:border-r border-border bg-elevated/30">
        <div className="flex items-center justify-between gap-3 mb-5">
          <button
            onClick={prevMonth}
            className={buttonVariants({ size: "icon-md" })}
            aria-label="Mes anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <p className="text-xs font-mono uppercase tracking-wider text-muted">
              {year}
            </p>
            <h3 className="text-lg md:text-xl font-sans font-bold text-primary truncate">
              {MONTH_NAMES[month]}
            </h3>
            {!isCurrentMonth && (
              <button
                onClick={jumpToCurrentMonth}
                className={buttonVariants({ variant: "accent", size: "sm" })}
                aria-label="Saltar a mes actual"
              >
                <CalendarDays className="w-3 h-3" />
                Hoy
              </button>
            )}
          </div>

          <button
            onClick={nextMonth}
            className={buttonVariants({ size: "icon-md" })}
            aria-label="Mes siguiente"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {isLoading ? (
          <CalendarSkeleton />
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1.5 mb-1.5">
              {WEEKDAYS.map((day, i) => (
                <div
                  key={day}
                  className={cn(
                    "py-1 text-center text-2xs md:text-xs font-mono font-semibold uppercase tracking-wider",
                    i >= 5 ? "text-muted/70" : "text-muted",
                  )}
                >
                  <span className="md:hidden">{day.charAt(0)}</span>
                  <span className="hidden md:inline">{day}</span>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="min-h-16 md:min-h-24 rounded-lg bg-background/40"
                  aria-hidden
                />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const key = toDateKey(year, month, day);
                const dayEvents = eventsByDate[key] ?? [];
                const isToday = day === todayKey;
                const overflow = dayEvents.length > MAX_PILLS ? dayEvents.length - MAX_PILLS : 0;
                const dayOfWeek = (startWeekday + i) % 7;
                const isWeekend = dayOfWeek >= 5;

                return (
                  <div
                    key={day}
                    className={cn(
                      "min-h-16 md:min-h-24 rounded-lg border p-1 md:p-1.5 flex flex-col transition-colors",
                      isToday
                        ? "border-accent/50 bg-accent/8 shadow-[inset_0_0_0_1px_color-mix(in_srgb,var(--color-accent)_20%,transparent)]"
                        : dayEvents.length > 0
                          ? "border-border bg-card hover:border-accent/30"
                          : isWeekend
                            ? "border-transparent bg-background/50"
                            : "border-transparent bg-card/60",
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-5 h-5 md:w-6 md:h-6 text-2xs md:text-xs font-mono rounded-full self-start",
                        isToday
                          ? "bg-accent text-accent-foreground font-bold"
                          : "text-primary",
                      )}
                    >
                      {day}
                    </span>

                    <div className="mt-0.5 md:mt-1 space-y-0.5 flex-1 min-h-0">
                      {dayEvents.slice(0, MAX_PILLS).map((ev, j) => (
                        <EventDialog
                          key={`${j}-${ev.date}-${ev.title}`}
                          event={ev}
                          className="block w-full text-left truncate rounded-sm px-1 py-0.5 text-[9px] md:text-2xs font-mono text-accent bg-accent/10 border-l-2 border-accent hover:bg-accent/15 transition-colors"
                          title={ev.title}
                        >
                          {ev.title}
                        </EventDialog>
                      ))}
                      {overflow > 0 && (
                        <span className="block text-[9px] md:text-2xs font-mono text-muted px-1">
                          +{overflow} más
                        </span>
                      )}
                    </div>
                  </div>
                );
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
      />
    </div>
  );
}
