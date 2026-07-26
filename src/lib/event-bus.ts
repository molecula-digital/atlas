import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'

export const EVENT_DETAIL_EVENT = 'open-event-detail' as const
export const EVENT_CLOSE_EVENT = 'close-event-detail' as const

export function openEventDetail(event: TechEvent): void {
  window.dispatchEvent(new CustomEvent(EVENT_DETAIL_EVENT, { detail: event }))
}

export function closeEventDetail(): void {
  window.dispatchEvent(new CustomEvent(EVENT_CLOSE_EVENT))
}

export function getEventHref(event: Pick<TechEvent, 'slug'>): string {
  return getEventPath(event.slug)
}

export function handleEventClick(
  event: TechEvent,
  e: { metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean; button: number; preventDefault: () => void },
): void {
  if (
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    e.button !== 0
  ) {
    return
  }

  e.preventDefault()
  openEventDetail(event)
}
