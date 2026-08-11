import { listAllCalendarItems, getEventDetail } from '../src/lib/luma/client'
import { mapLumaEventToPayload } from '../src/lib/luma/map'

const SEEDED_CALENDARS = [
  { name: 'Gina', calendarId: 'cal-Pf2My2TlVNz1N89' },
  { name: 'La Cripto Plebada', calendarId: 'cal-JMmiSzKO7KGGF5R' },
  { name: 'Cursor Culiacan, Mexico', calendarId: 'cal-FxFii0ovO9ZQUJg' },
]

async function dryRunCalendar(calendarId: string, name: string) {
  const entries = await listAllCalendarItems({
    calendarId,
    period: 'past',
    maxPages: 1,
  })
  console.log(
    `\n=== ${name} (${calendarId}) — ${entries.length} past entries ===`,
  )

  for (const entry of entries.slice(0, 3)) {
    const detail = await getEventDetail(entry.event.api_id)
    if ((!detail.hosts || !detail.hosts.length) && entry.hosts) {
      detail.hosts = entry.hosts
    }
    if (!detail.calendar && entry.calendar) {
      detail.calendar = entry.calendar
    }
    const mapped = mapLumaEventToPayload(detail, {
      fallbackCalendarId: calendarId,
    })
    console.log(
      JSON.stringify(
        {
          title: mapped.title,
          slug: mapped.slug,
          date: mapped.date,
          organizer: mapped.organizer,
          location: mapped.location.slice(0, 100),
          modality: mapped.modality,
          url: mapped.url,
          externalId: mapped.externalId,
          externalCalendarId: mapped.externalCalendarId,
          hasDescription: Boolean(mapped.description),
          image: Boolean(mapped.externalImageUrl),
        },
        null,
        2,
      ),
    )
  }
}

async function main() {
  for (const calendar of SEEDED_CALENDARS) {
    await dryRunCalendar(calendar.calendarId, calendar.name)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
