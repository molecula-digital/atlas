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

export function mapLocationType(
  locationType: string | null | undefined,
): AtlasModality {
  switch ((locationType || '').toLowerCase()) {
    case 'online':
    case 'virtual':
      return 'online'
    case 'hybrid':
      return 'hybrid'
    case 'offline':
    default:
      return 'in-person'
  }
}

function pickLocalizedAddress(geo: LumaGeoAddress | null | undefined): string {
  if (!geo) return ''
  const es = geo.localized?.['es-419']
  return (
    es?.full_address ||
    es?.address ||
    geo.full_address ||
    geo.address ||
    geo.short_address ||
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
  const location = pickLocalizedAddress(event.geo_address_info)
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
    modality: mapLocationType(event.location_type),
    meetLink: event.virtual_info?.meeting_url?.trim() || '',
    url: eventUrl,
    registerUrl: eventUrl,
    externalImageUrl: event.cover_url?.trim() || '',
    externalSource: 'luma',
    externalId: event.api_id,
    externalCalendarId: calendarId,
  }
}
