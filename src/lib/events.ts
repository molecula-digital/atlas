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
  description: string
  url: string
  location: string
  mapsUrl: string
  modality: string
  isInPerson: boolean
  meetLink: string
  image?: string | null
  registerUrl: string
}

export function getEventPath(slug: string): string {
  return `/eventos/${slug}`
}

function getImageUrl(image: Event['image']): string | null {
  if (typeof image === 'object' && image !== null && (image as Media).url) {
    return toPublicMediaUrl((image as Media).url)
  }
  return null
}

function lexicalToPlainText(data: Event['description']): string {
  if (!data?.root?.children) return ''
  function extractText(node: { text?: string; children?: unknown[] }): string {
    if (typeof node.text === 'string') return node.text
    if (Array.isArray(node.children)) {
      return node.children
        .map((child) => extractText(child as { text?: string; children?: unknown[] }))
        .join('')
    }
    return ''
  }
  return data.root.children
    .map((child) => extractText(child as { text?: string; children?: unknown[] }))
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

  return {
    id: String(doc.id),
    slug: (doc as Event & { slug?: string }).slug || fallbackSlug,
    title: doc.title,
    organizer: doc.organizer || '',
    date: (doc.date || '').split('T')[0],
    startTime: payloadTimeAsStored(doc.startTime),
    endTime: payloadTimeAsStored(doc.endTime),
    description: lexicalToPlainText(doc.description),
    url: doc.url || '',
    location: doc.location || '',
    mapsUrl: doc.mapsUrl || '',
    modality: doc.modality || 'in-person',
    isInPerson: doc.modality === 'in-person',
    meetLink: doc.meetLink || '',
    image: getImageUrl(doc.image),
    registerUrl: doc.registerUrl || '',
  }
}

// Fixed table instead of toLocaleDateString — ICU output differs between Node and
// browsers ("sept" vs "sep"), which shows up as a hydration mismatch.
const MONTH_ABBR = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
]

export function formatEventDateBadge(dateStr: string): { day: string; month: string } {
  const [, m, d] = dateStr.split('-').map(Number)
  return {
    day: String(d),
    month: MONTH_ABBR[(m - 1) % 12] ?? '',
  }
}

/** Events from `today` onward, soonest first. Pass the day explicitly so it stays pure. */
export function selectUpcomingEvents(events: TechEvent[], today: string): TechEvent[] {
  return events
    .filter((ev) => ev.date >= today)
    .sort(
      (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime),
    )
}

export function groupEventsByDate(events: TechEvent[]): Record<string, TechEvent[]> {
  const map: Record<string, TechEvent[]> = {}
  for (const ev of events) {
    const dateKey = ev.date?.split('T')[0]
    if (!dateKey) continue
    if (!map[dateKey]) map[dateKey] = []
    map[dateKey].push(ev)
  }
  return map
}
