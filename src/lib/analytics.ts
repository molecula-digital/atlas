'use client'

import posthog from 'posthog-js'
import type { TechEvent } from '@/lib/events'
import { isPastEventDate } from '@/lib/events'

/**
 * Every client-side PostHog capture in the app goes through this module.
 *
 * Two rules make the data survive refactors:
 *   1. Property *values* are stable keys, never UI copy. Renaming a button
 *      label must not silently split a metric in two.
 *   2. Entity properties are built by one function per entity, so a chart
 *      grouped by `event_slug` keeps working no matter which surface fired it.
 */

/**
 * Where an interaction happened. Fully qualified because the same component is
 * mounted in more than one place — the calendar renders on both `/` and
 * `/eventos`, and telling those apart is the entire point.
 */
export const EVENT_SURFACE = {
  homeStrip: 'home_upcoming_strip',
  homeCalendar: 'home_calendar',
  homeCalendarSidebar: 'home_calendar_sidebar',
  eventsPageCalendar: 'events_page_calendar',
  eventsPageCalendarSidebar: 'events_page_calendar_sidebar',
  eventsPagePastTimeline: 'events_page_past_timeline',
  detailRelated: 'event_detail_related',
  detailPage: 'event_detail_page',
  modal: 'event_modal',
} as const

export type EventSurface = (typeof EVENT_SURFACE)[keyof typeof EVENT_SURFACE]

/** Which page a shared calendar instance is mounted on. */
export type CalendarPlacement = 'home' | 'events_page'

export function calendarSurface(placement: CalendarPlacement): EventSurface {
  return placement === 'home'
    ? EVENT_SURFACE.homeCalendar
    : EVENT_SURFACE.eventsPageCalendar
}

export function calendarSidebarSurface(placement: CalendarPlacement): EventSurface {
  return placement === 'home'
    ? EVENT_SURFACE.homeCalendarSidebar
    : EVENT_SURFACE.eventsPageCalendarSidebar
}

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
  posthog.capture('event_card_clicked', {
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
  posthog.capture('event_viewed', { ...eventProps(event), surface })
}

/** The user left for the external registration page. */
export function captureEventRegistrationStarted(
  event: TechEvent,
  surface: EventSurface,
) {
  posthog.capture('event_registration_started', {
    ...eventProps(event),
    surface,
  })
}

/** Stable provider keys — decoupled from the labels shown in the dialog. */
export type CalendarProvider = 'google' | 'outlook' | 'yahoo' | 'apple_ics'

export function captureEventAddedToCalendar(
  event: TechEvent,
  provider: CalendarProvider,
  surface: EventSurface,
) {
  posthog.capture('event_added_to_calendar', {
    ...eventProps(event),
    provider,
    surface,
  })
}

/** What kind of thing was shared — set by each ShareButton call site. */
export type ShareContentType = 'event' | 'entry' | 'job' | 'news' | 'profile'

export function captureContentShared(
  method: 'shared' | 'copied',
  contentType: ShareContentType | undefined,
  contentId: string | undefined,
) {
  posthog.capture('content_shared', {
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
  posthog.capture('job_application_started', {
    job_slug: job.slug,
    job_title: job.title,
    job_company: job.company ?? null,
    job_modality: job.modality ?? null,
  })
}
