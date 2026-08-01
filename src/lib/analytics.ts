'use client'

import posthog from 'posthog-js'
import type { TechEvent } from '@/lib/events'
import { isPastEventDate } from '@/lib/events'
import {
  ANALYTICS_EVENTS,
  type AnalyticsEvent,
  type CalendarProvider,
  type DirectoryCta,
  type EntrySurface,
  type EventLinkType,
  type EventSurface,
  type ShareContentType,
} from '@/lib/analytics-events'

/**
 * Every PostHog capture in the app goes through this module.
 *
 * Two rules make the data survive refactors:
 *   1. Names and property *values* come from `analytics-events.ts`, never from
 *      UI copy. Renaming a button label must not silently split a metric.
 *   2. Entity properties are built by one function per entity, so a chart
 *      grouped by `event_slug` keeps working no matter which surface fired it.
 */

/**
 * Why an action did not complete. These need different responses, so they must
 * not collapse into one "it failed":
 *   - `response`  the server answered and rejected us
 *   - `network`   the request never arrived (offline, DNS, blocked)
 *   - `validation` we rejected it ourselves, before any request
 */
export type FailureKind = 'response' | 'network' | 'validation'

/**
 * An action the user asked for did not complete.
 *
 * `reason` is the API's own error string. It is the server's wording rather
 * than a value from this file, so treat it as a diagnostic to read, not a
 * dimension to build a metric on — the wording can change without warning.
 */
export function captureRequestFailed(
  event: AnalyticsEvent,
  {
    status,
    reason,
    kind,
  }: {
    /** HTTP status, or null when no response was received. */
    status: number | null
    reason?: string | null
    /** Defaults from `status`; pass it for failures that skipped the request. */
    kind?: FailureKind
  },
  properties?: Record<string, unknown>,
) {
  posthog.capture(event, {
    ...properties,
    status,
    reason: reason ?? null,
    failure_kind: kind ?? (status === null ? 'network' : 'response'),
  })
}

/**
 * Reads the error message out of a failed response without disturbing the
 * caller's own parsing — every call site here has already read, or is about to
 * read, the same body.
 */
export async function readErrorReason(response: Response): Promise<string | null> {
  try {
    const body = (await response.clone().json()) as { error?: unknown }
    return typeof body.error === 'string' ? body.error : null
  } catch {
    return null
  }
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

/**
 * A directory entry was picked out of a listing on the home page.
 *
 * Fires on the *listing*, so `surface` answers whether the curated Destacados
 * tiles or the raw Últimos registros strip actually earns its place — and,
 * against `directory_cta_clicked`, whether either beats just sending people to
 * the directory.
 */
export function captureEntryCardClicked(
  entry: { slug: string; name: string; entryType: string; city?: string | null },
  surface: EntrySurface,
) {
  posthog.capture(ANALYTICS_EVENTS.entryCardClicked, {
    entry_slug: entry.slug,
    entry_name: entry.name,
    entry_type: entry.entryType,
    entry_city: entry.city ?? null,
    surface,
  })
}

/** Someone chose to browse the whole directory instead of a specific entry. */
export function captureDirectoryCtaClicked(cta: DirectoryCta) {
  posthog.capture(ANALYTICS_EVENTS.directoryCtaClicked, { cta })
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
  DIRECTORY_CTA,
  ENTRY_SURFACE,
  EVENT_SURFACE,
  calendarSidebarSurface,
  calendarSurface,
} from '@/lib/analytics-events'
export type {
  AnalyticsEvent,
  CalendarPlacement,
  CalendarProvider,
  DirectoryCta,
  EntrySurface,
  EventLinkType,
  EventSurface,
  ShareContentType,
} from '@/lib/analytics-events'
