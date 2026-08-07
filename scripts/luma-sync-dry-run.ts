import { listAllCalendarItems, getEventDetail } from '../src/lib/luma/client'
import { mapLumaEventToPayload } from '../src/lib/luma/map'

async function main() {
  const calendarId = 'cal-Pf2My2TlVNz1N89'
  const entries = await listAllCalendarItems({
    calendarId,
    period: 'past',
    maxPages: 1,
  })
  console.log('entries', entries.length)

  for (const entry of entries) {
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

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
