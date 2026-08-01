'use client'

import posthog from 'posthog-js'
import type { TechEvent } from '@/lib/events'
import { isPastEventDate } from '@/lib/events'
import {
  ANALYTICS_EVENTS,
  type CalendarProvider,
  type EventLinkType,
  type EventSurface,
  type ShareContentType,
} from '@/lib/analytics-events'

/**
 * Every client-side PostHog capture in the app goes through this module.
 *
 * Two rules make the data survive refactors:
 *   1. Names and property *values* come from `analytics-events.ts`, never from
 *      UI copy. Renaming a button label must not silently split a metric.
 *   2. Entity properties are built by one function per entity, so a chart
 *      grouped by `event_slug` keeps working no matter which surface fired it.
 */

/** Identity + segmentation properties shared by every event-related capture. */
function eventProps(event: TechEvent) {
  return {
    event_slug: event.slug,
    event_title: event.title,
    event_organizer: event.organizer || null,
    event_is_in_person: Boolean(event.isInPerson),
    event_is_past: isPastEventDate(event.date),
    event_has_registration: Boolean(event.registerUrl),
  }
}

/**
 * A user picked an event out of a listing. Fires on the *listing* surface, so
 * comparing `surface` answers which discovery path people actually use.
 */
export function captureEventCardClicked(
  event: TechEvent,
  surface: EventSurface,
  destination: 'page' | 'modal',
) {
  posthog.capture(ANALYTICS_EVENTS.eventCardClicked, {
    ...eventProps(event),
    surface,
    destination,
  })
}

/**
 * Event details were actually shown. Needed because the modal never changes the
 * URL, so `$pageview` cannot see the most common way people read an event.
 */
export function captureEventViewed(event: TechEvent, surface: EventSurface) {
  posthog.capture(ANALYTICS_EVENTS.eventViewed, {
    ...eventProps(event),
    surface,
  })
}

/** The user left for the external registration page. */
export function captureEventRegistrationStarted(
  event: TechEvent,
  surface: EventSurface,
) {
  posthog.capture(ANALYTICS_EVENTS.eventRegistrationStarted, {
    ...eventProps(event),
    surface,
  })
}

export function captureEventAddedToCalendar(
  event: TechEvent,
  provider: CalendarProvider,
  surface: EventSurface,
) {
  posthog.capture(ANALYTICS_EVENTS.eventAddedToCalendar, {
    ...eventProps(event),
    provider,
    surface,
  })
}

/**
 * A link off the event page was followed. Worth separating by `link_type`:
 * a maps click on an in-person event is attendance intent, and a meet link
 * click is about as close to attendance as we can observe.
 */
export function captureEventLinkClicked(
  event: TechEvent,
  linkType: EventLinkType,
  surface: EventSurface,
) {
  posthog.capture(ANALYTICS_EVENTS.eventExternalLinkClicked, {
    ...eventProps(event),
    link_type: linkType,
    surface,
  })
}

export function captureContentShared(
  method: 'shared' | 'copied',
  contentType: ShareContentType | undefined,
  contentId: string | undefined,
) {
  posthog.capture(ANALYTICS_EVENTS.contentShared, {
    method,
    content_type: contentType ?? null,
    content_id: contentId ?? null,
  })
}

export function captureJobApplicationStarted(job: {
  slug: string
  title: string
  company?: string | null
  modality?: string | null
}) {
  posthog.capture(ANALYTICS_EVENTS.jobApplicationStarted, {
    job_slug: job.slug,
    job_title: job.title,
    job_company: job.company ?? null,
    job_modality: job.modality ?? null,
  })
}

// Re-exported so components have a single analytics import.
export {
  ANALYTICS_EVENTS,
  EVENT_SURFACE,
  calendarSidebarSurface,
  calendarSurface,
} from '@/lib/analytics-events'
export type {
  AnalyticsEvent,
  CalendarPlacement,
  CalendarProvider,
  EventLinkType,
  EventSurface,
  ShareContentType,
} from '@/lib/analytics-events'
