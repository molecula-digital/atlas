import type { Event, Media } from '@/payload-types'
import { EVENT_TIMEZONE } from '@/config'
import { toPublicMediaUrl } from '@/lib/media-url'

export interface TechEvent {
  id: string
  slug: string
  title: string
  organizer: string
  date: string
  startTime: string
  endTime: string
  /** Plain-text description for meta tags, JSON-LD, and compact previews. */
  description: string
  /** Lexical rich text for the Acerca de section (headings, lists, links). */
  descriptionRich?: Event['description']
  url: string
  location: string
  mapsUrl: string
  modality: string
  isInPerson: boolean
  meetLink: string
  image?: string | null
  registerUrl: string
}

/** Current calendar date in the timezone where events take place. */
export function getEventDateToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )

  return `${values.year}-${values.month}-${values.day}`
}

/**
 * Registration closes on the calendar day after an event.
 * Comparing date keys keeps registration open for the event's entire local day.
 */
export function isPastEventDate(
  eventDate: string,
  today = getEventDateToday(),
): boolean {
  return eventDate.split('T')[0] < today
}

export function getEventPath(slug: string): string {
  return `/eventos/${slug}`
}

function getImageUrl(doc: Event): string | null {
  const image = doc.image
  if (typeof image === 'object' && image !== null && (image as Media).url) {
    return toPublicMediaUrl((image as Media).url)
  }
  if (typeof doc.externalImageUrl === 'string' && doc.externalImageUrl.trim()) {
    return doc.externalImageUrl.trim()
  }
  return null
}

function lexicalToPlainText(data: Event['description']): string {
  if (!data?.root?.children) return ''
  function extractText(node: { text?: string; children?: unknown[] }): string {
    if (typeof node.text === 'string') return node.text
    if (Array.isArray(node.children)) {
      return node.children
        .map((child) =>
          extractText(child as { text?: string; children?: unknown[] }),
        )
        .join('')
    }
    return ''
  }
  return data.root.children
    .map((child) =>
      extractText(child as { text?: string; children?: unknown[] }),
    )
    .join('\n')
    .trim()
}

/** Site timezone — event times are wall-clock in Sinaloa, not the viewer's browser. */

/**
 * Returns the wall-clock time from Payload without using the viewer's browser
 * timezone. Plain strings pass through unchanged; ISO timestamps from Payload
 * date fields are shown in the site's canonical timezone.
 */
export function payloadTimeAsStored(value: string | null | undefined): string {
  if (!value) return ''
  if (!value.includes('T')) return value

  return new Intl.DateTimeFormat('en-US', {
    timeZone: EVENT_TIMEZONE,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(value))
}

export function eventDocToTechEvent(doc: Event): TechEvent {
  const date = (doc.date || '').split('T')[0]
  const fallbackSlug = doc.title
    ? `${doc.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}${date ? `-${date}` : ''}`
    : String(doc.id)
  const description = lexicalToPlainText(doc.description)

  return {
    id: String(doc.id),
    slug: (doc as Event & { slug?: string }).slug || fallbackSlug,
    title: doc.title,
    organizer: doc.organizer || '',
    date: (doc.date || '').split('T')[0],
    startTime: payloadTimeAsStored(doc.startTime),
    endTime: payloadTimeAsStored(doc.endTime),
    description,
    descriptionRich: description ? (doc.description ?? undefined) : undefined,
    url: doc.url || '',
    location: doc.location || '',
    mapsUrl: doc.mapsUrl || '',
    modality: doc.modality || 'in-person',
    isInPerson: doc.modality === 'in-person',
    meetLink: doc.meetLink || '',
    image: getImageUrl(doc),
    registerUrl: doc.registerUrl || '',
  }
}

// Fixed table instead of toLocaleDateString — ICU output differs between Node and
// browsers ("sept" vs "sep"), which shows up as a hydration mismatch.
const MONTH_ABBR = [
  'ene',
  'feb',
  'mar',
  'abr',
  'may',
  'jun',
  'jul',
  'ago',
  'sep',
  'oct',
  'nov',
  'dic',
]

export function formatEventDateBadge(dateStr: string): {
  day: string
  month: string
} {
  const [, m, d] = dateStr.split('-').map(Number)
  return {
    day: String(d),
    month: MONTH_ABBR[(m - 1) % 12] ?? '',
  }
}

/** Capitalized 3-letter month for the calendar tile (e.g. "Ago"). */
export function formatEventMonthShort(dateStr: string): string {
  const { month } = formatEventDateBadge(dateStr)
  return month ? month.charAt(0).toUpperCase() + month.slice(1) : ''
}

/** Full weekday + date in Spanish (e.g. "Sábado, 29 de agosto"). */
export function formatEventDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const formatted = date.toLocaleDateString('es-MX', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

/** Time range with spaced dash (e.g. "8:00 AM - 7:30 PM"). */
export function formatEventTimeRange(
  startTime: string,
  endTime: string,
): string {
  if (startTime && endTime) return `${startTime} - ${endTime}`
  return startTime || endTime
}

/** Events from `today` onward, soonest first. Pass the day explicitly so it stays pure. */
export function selectUpcomingEvents(
  events: TechEvent[],
  today: string,
): TechEvent[] {
  return events
    .filter((ev) => ev.date >= today)
    .sort(
      (a, b) =>
        a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
}

/** Events before `today`, most recent first. Pass the day explicitly so it stays pure. */
export function selectPastEvents(
  events: TechEvent[],
  today: string,
): TechEvent[] {
  return events
    .filter((ev) => ev.date < today)
    .sort(
      (a, b) =>
        b.date.localeCompare(a.date) || b.startTime.localeCompare(a.startTime),
    )
}

/**
 * Other upcoming events for a detail page.
 * Excludes the current event by id (and slug as a safety net). Never includes past events.
 */
export function selectOtherEvents(
  events: TechEvent[],
  options: {
    excludeId: string
    excludeSlug?: string
    today: string
    limit?: number
  },
): TechEvent[] {
  const { excludeId, excludeSlug, today, limit = 3 } = options
  const others = events.filter(
    (ev) => ev.id !== excludeId && (!excludeSlug || ev.slug !== excludeSlug),
  )
  return selectUpcomingEvents(others, today).slice(0, limit)
}

export function groupEventsByDate(
  events: TechEvent[],
): Record<string, TechEvent[]> {
  const map: Record<string, TechEvent[]> = {}
  for (const ev of events) {
    const dateKey = ev.date?.split('T')[0]
    if (!dateKey) continue
    if (!map[dateKey]) map[dateKey] = []
    map[dateKey].push(ev)
  }
  return map
}
