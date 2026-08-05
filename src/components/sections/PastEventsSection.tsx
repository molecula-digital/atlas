import { SectionBlock } from '@/components/layout/SectionBlock'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { PastEventsTimeline } from '@/components/calendar/PastEventsTimeline'
import { getPublishedEvents } from '@/lib/payload'
import { eventDocToTechEvent, selectPastEvents } from '@/lib/events'

/** Anchor used for deep links to the past-events archive (e.g. `/eventos#historial`). */
export const PAST_EVENTS_ANCHOR = 'historial'

export async function PastEventsSection() {
  const result = await getPublishedEvents(200)
  const today = new Date().toISOString().slice(0, 10)
  const past = selectPastEvents(result.docs.map(eventDocToTechEvent), today)

  if (past.length === 0) return null

  return (
    <SectionBlock id={PAST_EVENTS_ANCHOR}>
      <div className="space-y-6">
        <SectionTitle description="Meetups, talleres y conferencias que ya dejaron huella">
          Lo que ya pasó
        </SectionTitle>

        <PastEventsTimeline events={past} />
      </div>
    </SectionBlock>
  )
}
