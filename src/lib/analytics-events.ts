/**
 * The analytics vocabulary: every event name and every stable property value
 * the app reports to PostHog.
 *
 * Deliberately free of a `'use client'` directive and of any posthog-js import,
 * so route handlers can share these names with the browser without dragging the
 * browser SDK into the server bundle. Client capture helpers live in
 * `analytics.ts`; the server client lives in `posthog-server.ts`.
 *
 * Renaming a value here renames it in PostHog and orphans the history behind
 * the old name — add a new key instead when a metric needs to change meaning.
 */
export const ANALYTICS_EVENTS = {
  // Auth. One sign-in event with `is_new_user`, because Google is the only
  // provider and the sign-in page doubles as sign-up.
  signInStarted: 'sign_in_started',
  signedIn: 'signed_in',

  // Event discovery and engagement.
  eventCardClicked: 'event_card_clicked',
  eventViewed: 'event_viewed',
  eventRegistrationStarted: 'event_registration_started',
  eventAddedToCalendar: 'event_added_to_calendar',
  eventExternalLinkClicked: 'event_external_link_clicked',

  // Directory browsing.
  directoryFilterApplied: 'directory_filter_applied',
  directorySortChanged: 'directory_sort_changed',

  // Directory submissions (client view of the funnel).
  submitWizardStarted: 'submit_wizard_started',
  submitWizardStepCompleted: 'submit_wizard_step_completed',
  submitWizardAbandoned: 'submit_wizard_abandoned',
  directoryEntrySubmitted: 'directory_entry_submitted',
  directoryEntryUpdated: 'directory_entry_updated',

  // Jobs.
  jobApplicationStarted: 'job_application_started',
  jobUpdated: 'job_updated',

  // Account and community.
  profileUpdated: 'profile_updated',
  newsletterSubscribed: 'newsletter_subscribed',
  contentShared: 'content_shared',
  whatsappCommunityJoinStarted: 'whatsapp_community_join_started',

  // Server-side only. These record outcomes the browser cannot observe —
  // rate limits, validation failures, and 500s all look like one opaque
  // non-ok response from the client's side.
  newsletterSubscriptionConfirmed: 'newsletter_subscription_confirmed',
  newsletterSubscriptionRejected: 'newsletter_subscription_rejected',
  entrySubmissionCreated: 'entry_submission_created',
  entrySubmissionRejected: 'entry_submission_rejected',
  jobSubmissionCreated: 'job_submission_created',
  jobSubmissionRejected: 'job_submission_rejected',
} as const

export type AnalyticsEvent =
  (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

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

export function calendarSidebarSurface(
  placement: CalendarPlacement,
): EventSurface {
  return placement === 'home'
    ? EVENT_SURFACE.homeCalendarSidebar
    : EVENT_SURFACE.eventsPageCalendarSidebar
}

/** Stable provider keys — decoupled from the labels shown in the dialog. */
export type CalendarProvider = 'google' | 'outlook' | 'yahoo' | 'apple_ics'

/** Which link off an event page was followed. */
export type EventLinkType = 'website' | 'maps' | 'meet'

/** What kind of thing was shared — set by each ShareButton call site. */
export type ShareContentType = 'event' | 'entry' | 'job' | 'news' | 'profile'
