'use client'

import type { TechEvent } from '@/lib/events'
import {
  type AnalyticsEvent,
  type CalendarProvider,
  type DirectoryCta,
  type EntrySurface,
  type EventLinkType,
  type EventSurface,
  type ShareContentType,
  type WhatsAppSurface,
} from '@/lib/analytics-events'

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
) {}

/**
 * Reads the error message out of a failed response without disturbing the
 * caller's own parsing — every call site here has already read, or is about to
 * read, the same body.
 */
export async function readErrorReason(
  response: Response,
): Promise<string | null> {
  try {
    const body = (await response.clone().json()) as { error?: unknown }
    return typeof body.error === 'string' ? body.error : null
  } catch {
    return null
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
) {}

/**
 * Event details were actually shown on the detail page.
 */
export function captureEventViewed(event: TechEvent, surface: EventSurface) {}

/** The user left for the external registration page. */
export function captureEventRegistrationStarted(
  event: TechEvent,
  surface: EventSurface,
) {}

export function captureEventAddedToCalendar(
  event: TechEvent,
  provider: CalendarProvider,
  surface: EventSurface,
) {}

/**
 * A link off the event page was followed. Worth separating by `link_type`:
 * a maps click on an in-person event is attendance intent, and a meet link
 * click is about as close to attendance as we can observe.
 */
export function captureEventLinkClicked(
  event: TechEvent,
  linkType: EventLinkType,
  surface: EventSurface,
) {}

export function captureContentShared(
  method: 'shared' | 'copied',
  contentType: ShareContentType | undefined,
  contentId: string | undefined,
) {}

/**
 * A directory entry was picked out of a listing on the home page.
 *
 * Fires on the *listing*, so `surface` answers whether the curated Destacados
 * tiles or the raw Últimos registros strip actually earns its place — and,
 * against `directory_cta_clicked`, whether either beats just sending people to
 * the directory.
 */
export function captureEntryCardClicked(
  entry: {
    slug: string
    name: string
    entryType: string
    city?: string | null
  },
  surface: EntrySurface,
) {}

/** Someone chose to browse the whole directory instead of a specific entry. */
export function captureDirectoryCtaClicked(cta: DirectoryCta) {}

/** A WhatsApp join link was followed, from one of several placements. */
export function captureWhatsAppJoinStarted(surface: WhatsAppSurface) {}

export function captureJobApplicationStarted(job: {
  slug: string
  title: string
  company?: string | null
  modality?: string | null
}) {}

// Re-exported so components have a single analytics import.
export {
  ANALYTICS_EVENTS,
  DIRECTORY_CTA,
  ENTRY_SURFACE,
  EVENT_SURFACE,
  WHATSAPP_SURFACE,
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
  WhatsAppSurface,
} from '@/lib/analytics-events'
