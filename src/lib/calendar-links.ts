import type { TechEvent } from '@/lib/events'
import { EVENT_TIMEZONE } from '@/config'

const EVENT_TZ = EVENT_TIMEZONE
/** Fallback when an event has a start but no end time. */
const DEFAULT_DURATION_MINUTES = 60

export interface CalendarEvent {
  title: string
  description: string
  location: string
  /** `YYYY-MM-DD` */
  date: string
  /** `HH:MM`, empty for all-day events. */
  startTime: string
  /** `HH:MM`, empty to fall back to a one-hour block. */
  endTime: string
  /** Canonical URL appended to the description so the pass links back. */
  url?: string
}

export function toCalendarEvent(event: TechEvent, url?: string): CalendarEvent {
  return {
    title: event.title,
    description: event.description,
    location: event.location,
    date: event.date,
    startTime: event.startTime,
    endTime: event.endTime,
    url,
  }
}

/**
 * Offset of `timeZone` from UTC, in minutes, at `utcDate`.
 *
 * Derived via Intl rather than hardcoding -06:00 so this stays correct if Mexico
 * reinstates DST (it dropped it in Oct 2022) or the site's timezone ever changes.
 */
function getTimeZoneOffsetMinutes(utcDate: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const parts = Object.fromEntries(
    dtf.formatToParts(utcDate).map((p) => [p.type, p.value]),
  )
  // `hour` comes back as 24 for midnight under hour12:false in some engines.
  const hour = Number(parts.hour) % 24
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    hour,
    Number(parts.minute),
    Number(parts.second),
  )
  return (asUtc - utcDate.getTime()) / 60_000
}

/**
 * Parses the time strings carried on a TechEvent.
 *
 * Payload time values may be plain strings ("6:30 PM", "18:30") or ISO timestamps
 * ("1970-01-01T18:30:00.000Z"). All of these have to be handled — naive
 * `split(':')` reads "6:30 PM" as 06:00.
 *
 * Returns null when the value is absent or unrecognised, which callers treat as
 * an all-day event rather than guessing at a wrong time.
 */
function parseClockTime(time: string | undefined): { hour: number; minute: number } | null {
  if (!time) return null
  const value = time.trim()

  const isoTime = value.match(/T(\d{2}):(\d{2})/)
  if (isoTime) {
    const hour = Number(isoTime[1])
    const minute = Number(isoTime[2])
    if (hour <= 23 && minute <= 59) return { hour, minute }
    return null
  }

  const twelveHour = value.match(/^(\d{1,2})(?::(\d{2}))?\s*([AaPp])\.?[Mm]\.?$/)
  if (twelveHour) {
    const hour = (Number(twelveHour[1]) % 12) + (twelveHour[3].toLowerCase() === 'p' ? 12 : 0)
    const minute = Number(twelveHour[2] ?? 0)
    if (hour <= 23 && minute <= 59) return { hour, minute }
    return null
  }

  const twentyFourHour = value.match(/^(\d{1,2}):(\d{2})/)
  if (twentyFourHour) {
    const hour = Number(twentyFourHour[1])
    const minute = Number(twentyFourHour[2])
    if (hour <= 23 && minute <= 59) return { hour, minute }
  }

  return null
}

/** Converts a wall-clock time in `EVENT_TZ` to the equivalent UTC instant. */
function zonedToUtc(date: string, hour: number, minute: number): Date {
  const [year, month, day] = date.split('-').map(Number)
  const naive = Date.UTC(year, month - 1, day, hour, minute)
  // Two passes: the first offset can be wrong when the guess lands on the far
  // side of a DST transition, the second settles it.
  let utc = naive - getTimeZoneOffsetMinutes(new Date(naive), EVENT_TZ) * 60_000
  utc = naive - getTimeZoneOffsetMinutes(new Date(utc), EVENT_TZ) * 60_000
  return new Date(utc)
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** `YYYYMMDDTHHMMSSZ` */
function toUtcStamp(d: Date): string {
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  )
}

/** `YYYYMMDD` in the event's own timezone — for all-day events. */
function toDateStamp(date: string): string {
  return date.replace(/-/g, '')
}

/** Adds `days` to a `YYYY-MM-DD` string. */
function addDays(date: string, days: number): string {
  const [y, m, d] = date.split('-').map(Number)
  const next = new Date(Date.UTC(y, m - 1, d + days))
  return `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`
}

interface Range {
  allDay: boolean
  /** UTC stamps for timed events, `YYYYMMDD` for all-day. */
  start: string
  end: string
}

function getRange(event: CalendarEvent): Range {
  const startClock = parseClockTime(event.startTime)

  if (!startClock) {
    return {
      allDay: true,
      start: toDateStamp(event.date),
      // DTEND is exclusive for all-day events.
      end: toDateStamp(addDays(event.date, 1)),
    }
  }

  const start = zonedToUtc(event.date, startClock.hour, startClock.minute)
  const endClock = parseClockTime(event.endTime)
  let end = endClock
    ? zonedToUtc(event.date, endClock.hour, endClock.minute)
    : new Date(start.getTime() + DEFAULT_DURATION_MINUTES * 60_000)

  // An end at or before the start means the event runs past midnight — the
  // stored end time is a wall clock with no date of its own.
  if (end.getTime() <= start.getTime()) {
    end = new Date(end.getTime() + 24 * 60 * 60_000)
  }

  return { allDay: false, start: toUtcStamp(start), end: toUtcStamp(end) }
}

function fullDescription(event: CalendarEvent): string {
  return [event.description, event.url].filter(Boolean).join('\n\n')
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const { start, end } = getRange(event)
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${start}/${end}`,
    details: fullDescription(event),
    location: event.location,
  })
  return `https://calendar.google.com/calendar/render?${params}`
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const { allDay, start, end } = getRange(event)
  // Outlook wants ISO-8601, not the compact iCalendar form.
  const iso = (stamp: string) =>
    allDay
      ? `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}`
      : `${stamp.slice(0, 4)}-${stamp.slice(4, 6)}-${stamp.slice(6, 8)}` +
        `T${stamp.slice(9, 11)}:${stamp.slice(11, 13)}:${stamp.slice(13, 15)}Z`

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.title,
    startdt: iso(start),
    enddt: iso(end),
    body: fullDescription(event),
    location: event.location,
  })
  if (allDay) params.set('allday', 'true')
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params}`
}

export function yahooCalendarUrl(event: CalendarEvent): string {
  const { allDay, start, end } = getRange(event)
  const params = new URLSearchParams({
    v: '60',
    title: event.title,
    desc: fullDescription(event),
    in_loc: event.location,
  })
  if (allDay) {
    params.set('dur', 'allday')
    params.set('st', start)
  } else {
    params.set('st', start)
    params.set('et', end)
  }
  return `https://calendar.yahoo.com/?${params}`
}

/** RFC 5545 requires CRLF line endings and escaping of `\ ; ,` and newlines. */
function escapeIcs(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n')
}

/** Called from a click handler, so `new Date()` here never reaches SSR output. */
export function buildIcs(event: CalendarEvent, uid: string): string {
  const { allDay, start, end } = getRange(event)
  const dtStart = allDay ? `DTSTART;VALUE=DATE:${start}` : `DTSTART:${start}`
  const dtEnd = allDay ? `DTEND;VALUE=DATE:${end}` : `DTEND:${end}`

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tech Atlas//Eventos//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    dtStart,
    dtEnd,
    `SUMMARY:${escapeIcs(event.title)}`,
    `DESCRIPTION:${escapeIcs(fullDescription(event))}`,
    `LOCATION:${escapeIcs(event.location)}`,
    ...(event.url ? [`URL:${event.url}`] : []),
    'END:VEVENT',
    'END:VCALENDAR',
  ]

  return lines.join('\r\n')
}
