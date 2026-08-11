import { EVENT_TIMEZONE } from '@/config'
import { slugify } from '@/lib/slug'
import type {
  LumaEventDetailResponse,
  LumaEventSummary,
  LumaGeoAddress,
  LumaHost,
  LumaTipTapNode,
} from './types'

export type AtlasModality = 'in-person' | 'online' | 'hybrid'

/** Payload Lexical document shape used by Events.description. */
export type LexicalDescription = {
  root: {
    type: 'root'
    children: Array<{
      type: string
      children: Array<{ type: string; text: string; version: number }>
      direction: 'ltr'
      format: ''
      indent: number
      version: number
    }>
    direction: 'ltr'
    format: ''
    indent: number
    version: number
  }
}

export interface MappedLumaEvent {
  title: string
  slug: string
  organizer: string
  description: LexicalDescription | null
  date: string
  startTime: string
  endTime: string
  location: string
  mapsUrl: string
  modality: AtlasModality
  meetLink: string
  url: string
  registerUrl: string
  externalImageUrl: string
  externalSource: 'luma'
  externalId: string
  externalCalendarId: string
  externalCalendarName: string
}

function formatParts(
  iso: string,
  timeZone: string,
): { date: string; hour: string; minute: string } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date(iso))
  const values = Object.fromEntries(
    parts.map(({ type, value }) => [type, value]),
  )
  // Intl can emit hour "24" for midnight in some locales — normalize.
  const hour = values.hour === '24' ? '00' : values.hour
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    hour,
    minute: values.minute,
  }
}

function tipTapNodeToPlain(node: LumaTipTapNode | undefined): string {
  if (!node) return ''
  if (typeof node.text === 'string') return node.text
  if (node.type === 'hard_break') return '\n'
  if (!Array.isArray(node.content)) return ''

  const parts = node.content.map(tipTapNodeToPlain)
  if (node.type === 'paragraph' || node.type === 'heading') {
    return parts.join('')
  }
  if (node.type === 'doc') {
    return parts.filter(Boolean).join('\n\n')
  }
  if (node.type === 'bullet_list' || node.type === 'ordered_list') {
    return parts.filter(Boolean).join('\n')
  }
  if (node.type === 'list_item') {
    return `• ${parts.join('')}`
  }
  return parts.join('')
}

export function tipTapToPlainText(
  mirror: LumaTipTapNode | null | undefined,
): string {
  return tipTapNodeToPlain(mirror ?? undefined).trim()
}

export function plainTextToLexical(text: string): LexicalDescription | null {
  const trimmed = text.trim()
  if (!trimmed) return null

  const paragraphs = trimmed.split(/\n{2,}/).map((block) => block.trim())

  return {
    root: {
      type: 'root',
      children: paragraphs.map((block) => ({
        type: 'paragraph',
        children: [
          {
            type: 'text',
            text: block.replace(/\n/g, ' '),
            version: 1,
          },
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        version: 1,
      })),
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

/** Luma online platforms from the public API `location_type` enum. */
const ONLINE_LOCATION_TYPES = new Set([
  'discord',
  'meet',
  'twitch',
  'twitter',
  'youtube',
  'zoom',
  // Aliases seen in older payloads / docs
  'online',
  'virtual',
])

export function mapLocationType(
  locationType: string | null | undefined,
): AtlasModality {
  const type = (locationType || '').toLowerCase()
  if (type === 'offline') return 'in-person'
  if (type === 'hybrid') return 'hybrid'
  if (ONLINE_LOCATION_TYPES.has(type)) return 'online'
  // `missing` / `unknown` / empty — fall back to in-person; callers still
  // attach geo when Luma provides an address.
  return 'in-person'
}

export function platformLocationLabel(
  locationType: string | null | undefined,
): string {
  switch ((locationType || '').toLowerCase()) {
    case 'youtube':
      return 'YouTube'
    case 'zoom':
      return 'Zoom'
    case 'meet':
      return 'Google Meet'
    case 'discord':
      return 'Discord'
    case 'twitch':
      return 'Twitch'
    case 'twitter':
      return 'X / Twitter'
    case 'online':
    case 'virtual':
      return 'En línea'
    default:
      return ''
  }
}

function pickLocalizedAddress(geo: LumaGeoAddress | null | undefined): string {
  if (!geo) return ''
  const es = geo.localized?.['es-419'] || geo.localized?.['es']
  // Prefer venue name, then full address, then city.
  return (
    es?.address ||
    geo.address ||
    es?.full_address ||
    geo.full_address ||
    es?.short_address ||
    geo.short_address ||
    es?.city ||
    geo.city ||
    ''
  )
}

export function mapsUrlFromGeo(geo: LumaGeoAddress | null | undefined): string {
  if (!geo) return ''
  if (geo.place_id) {
    return `https://www.google.com/maps/search/?api=1&query_place_id=${encodeURIComponent(geo.place_id)}`
  }
  const query = pickLocalizedAddress(geo)
  if (!query) return ''
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

export function lumaEventUrl(slugOrUrl: string): string {
  if (!slugOrUrl) return ''
  if (/^https?:\/\//i.test(slugOrUrl)) return slugOrUrl
  return `https://luma.com/${slugOrUrl.replace(/^\//, '')}`
}

/** Public Luma calendar page; Luma redirects slug/personal calendars as needed. */
export function lumaCalendarUrl(calendarId: string): string {
  if (!calendarId) return ''
  if (/^https?:\/\//i.test(calendarId)) return calendarId
  return `https://luma.com/calendar/${calendarId.replace(/^\//, '')}`
}

/**
 * Payload dayOnly dates are timestamptz. Midnight UTC (`T00:00:00.000Z`) renders
 * as the *previous* calendar day in America/Mazatlan (and any UTC− offset) in
 * the admin date picker. Noon UTC keeps the intended civil date in all zones
 * from UTC−12 through UTC+12 — the approach Payload documents for dayOnly.
 */
export function dayOnlyUtcNoon(date: string): string {
  const day = date.split('T')[0]
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return date
  return `${day}T12:00:00.000Z`
}

function organizerFromHosts(
  hosts: LumaHost[] | undefined,
  calendarName?: string | null,
): string {
  const named = (hosts ?? [])
    .map((h) => h.name?.trim())
    .filter((n): n is string => Boolean(n))
  if (named.length > 0) return named[0]
  return calendarName?.trim() || ''
}

export function mapLumaEventToPayload(
  detail: LumaEventDetailResponse,
  options?: { fallbackCalendarId?: string },
): MappedLumaEvent {
  const event: LumaEventSummary = detail.event
  const tz = event.timezone || EVENT_TIMEZONE
  const start = formatParts(event.start_at, tz)
  const plain = tipTapToPlainText(detail.description_mirror)
  const modality = mapLocationType(event.location_type)
  const geoLocation = pickLocalizedAddress(event.geo_address_info)
  const location =
    geoLocation ||
    (modality === 'online' ? platformLocationLabel(event.location_type) : '')
  const eventUrl = lumaEventUrl(event.url)
  const calendarId =
    event.calendar_api_id ||
    detail.calendar?.api_id ||
    options?.fallbackCalendarId ||
    ''

  return {
    title: event.name.trim(),
    slug: slugify(`${event.name}-${start.date}`),
    organizer: organizerFromHosts(detail.hosts, detail.calendar?.name),
    description: plainTextToLexical(plain),
    date: start.date,
    // Store absolute instants; the UI formats them in EVENT_TIMEZONE.
    startTime: event.start_at,
    endTime: event.end_at,
    location,
    mapsUrl: mapsUrlFromGeo(event.geo_address_info),
    modality,
    meetLink: event.virtual_info?.meeting_url?.trim() || '',
    url: eventUrl,
    registerUrl: eventUrl,
    externalImageUrl: event.cover_url?.trim() || '',
    externalSource: 'luma',
    externalId: event.api_id,
    externalCalendarId: calendarId,
    externalCalendarName: detail.calendar?.name?.trim() || '',
  }
}
