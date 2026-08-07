import { listAllCalendarItems, getEventDetail } from '../src/lib/luma/client'
import { mapLumaEventToPayload } from '../src/lib/luma/map'
import { EVENT_TIMEZONE } from '../src/config'
import { payloadTimeAsStored } from '../src/lib/events'

const calendars = [
  { name: 'Gina', id: 'cal-Pf2My2TlVNz1N89' },
  { name: 'Criptoplebada', id: 'cal-JMmiSzKO7KGGF5R' },
  { name: 'Cursor Culiacán', id: 'cal-FxFii0ovO9ZQUJg' },
]

const EVENT_FIELDS = [
  'title',
  'slug',
  'organizer',
  'description',
  'date',
  'startTime',
  'endTime',
  'location',
  'mapsUrl',
  'modality',
  'meetLink',
  'url',
  'registerUrl',
  'externalImageUrl',
  'externalSource',
  'externalId',
  'externalCalendarId',
] as const

type Gap = {
  calendar: string
  eventId: string
  title: string
  issues: string[]
}

function localParts(iso: string, tz: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(iso))
  const v = Object.fromEntries(parts.map((p) => [p.type, p.value]))
  return {
    date: `${v.year}-${v.month}-${v.day}`,
    time: `${v.hour}:${v.minute} ${v.dayPeriod}`,
  }
}

async function main() {
  const gaps: Gap[] = []
  const modalityCounts: Record<string, number> = {}
  const locationTypes = new Set<string>()
  let total = 0

  for (const cal of calendars) {
    const byId = new Map<
      string,
      Awaited<ReturnType<typeof listAllCalendarItems>>[number]
    >()
    for (const period of ['future', 'past'] as const) {
      const entries = await listAllCalendarItems({
        calendarId: cal.id,
        period,
        maxPages: 5,
      })
      for (const e of entries) byId.set(e.event.api_id, e)
    }
    console.log(`\n## ${cal.name} (${cal.id}) — ${byId.size} events`)

    for (const entry of byId.values()) {
      total++
      const detail = await getEventDetail(entry.event.api_id)
      if ((!detail.hosts || !detail.hosts.length) && entry.hosts) {
        detail.hosts = entry.hosts
      }
      if (!detail.calendar && entry.calendar) {
        detail.calendar = entry.calendar
      }

      const lt = detail.event.location_type || '(missing)'
      locationTypes.add(lt)
      const mapped = mapLumaEventToPayload(detail, {
        fallbackCalendarId: cal.id,
      })
      modalityCounts[mapped.modality] =
        (modalityCounts[mapped.modality] || 0) + 1

      const issues: string[] = []
      for (const f of EVENT_FIELDS) {
        if (mapped[f] === undefined) issues.push(`missing field ${f}`)
      }
      if (!mapped.title) issues.push('empty title')
      if (!mapped.slug) issues.push('empty slug')
      if (!mapped.date || !/^\d{4}-\d{2}-\d{2}$/.test(mapped.date)) {
        issues.push(`bad date ${mapped.date}`)
      }
      if (!mapped.startTime) issues.push('empty startTime')
      if (!mapped.endTime) issues.push('empty endTime')
      if (!mapped.externalId?.startsWith('evt-')) issues.push('bad externalId')
      if (!mapped.externalCalendarId?.startsWith('cal-')) {
        issues.push('bad externalCalendarId')
      }
      if (!mapped.url.startsWith('https://')) issues.push('bad url')
      if (mapped.registerUrl !== mapped.url) issues.push('registerUrl != url')
      if (!mapped.externalImageUrl) issues.push('no cover image')
      // Description is optional on Luma — only warn, still OK to sync.
      if (!mapped.organizer) issues.push('no organizer')

      if (mapped.modality === 'in-person') {
        if (!mapped.location) issues.push('in-person without location')
        if (!mapped.mapsUrl) issues.push('in-person without mapsUrl')
      }
      if (mapped.modality === 'online') {
        if (!mapped.location) issues.push('online without location label')
        // meetLink is often host-only on Luma's public API — not required.
      }

      const eventTz = detail.event.timezone || EVENT_TIMEZONE
      const inEventTz = localParts(detail.event.start_at, eventTz)
      const inSiteTz = localParts(detail.event.start_at, EVENT_TIMEZONE)
      if (inEventTz.date !== mapped.date) {
        issues.push(
          `date mismatch mapper=${mapped.date} eventTz=${inEventTz.date}`,
        )
      }
      if (eventTz !== EVENT_TIMEZONE && inEventTz.date !== inSiteTz.date) {
        issues.push(
          `TZ cross-midnight: eventTz=${eventTz} date=${inEventTz.date} siteTz date=${inSiteTz.date}`,
        )
      }

      const uiStart = payloadTimeAsStored(mapped.startTime)
      if (!uiStart) issues.push('UI startTime empty')

      if (lt !== 'offline') {
        console.log('  non-offline', mapped.title, {
          lt,
          modality: mapped.modality,
          virtual: detail.event.virtual_info,
          meetLink: mapped.meetLink,
        })
      }

      if (issues.length) {
        gaps.push({
          calendar: cal.name,
          eventId: mapped.externalId,
          title: mapped.title,
          issues,
        })
      }

      console.log(
        `  ${issues.length ? '⚠' : '✓'} ${mapped.date} ${uiStart}-${payloadTimeAsStored(mapped.endTime)} | ${mapped.modality} | ${mapped.title.slice(0, 40)} | loc=${mapped.location ? 'y' : 'n'} maps=${mapped.mapsUrl ? 'y' : 'n'} img=${mapped.externalImageUrl ? 'y' : 'n'} desc=${mapped.description ? 'y' : 'n'}`,
      )
    }
  }

  console.log('\n## Summary')
  console.log(
    JSON.stringify(
      {
        total,
        modalityCounts,
        locationTypes: [...locationTypes],
        gapCount: gaps.length,
      },
      null,
      2,
    ),
  )
  if (gaps.length) {
    console.log('\n## Gaps')
    for (const g of gaps) console.log(JSON.stringify(g, null, 2))
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
