/**
 * The analytics vocabulary: every event name and every stable property value
 * the app reports to PostHog.
 *
 * Every event is captured in the browser. Route handlers report nothing: each
 * one of them is reached from a page that already has a PostHog session, so a
 * server capture would only ever be a second copy of an event the client is
 * better placed to send — and one that costs a Node SDK, request-header
 * plumbing, and a datacenter IP on every geo breakdown to obtain.
 *
 * Failures are captured where the request fails, from `status` and the error
 * body, so an outcome is still recorded when a request does not succeed.
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
  // `directory_filter_applied.filter` is `entry_type` | `city` | `sector` | `all`.
  // For `sector`, `value` is the toggled sector label (Payload enum string).
  directoryFilterApplied: 'directory_filter_applied',
  directorySortChanged: 'directory_sort_changed',
  entryCardClicked: 'entry_card_clicked',
  directoryCtaClicked: 'directory_cta_clicked',

  // Directory submissions.
  submitWizardStarted: 'submit_wizard_started',
  submitWizardStepCompleted: 'submit_wizard_step_completed',
  submitWizardAbandoned: 'submit_wizard_abandoned',
  directoryEntrySubmitted: 'directory_entry_submitted',
  directoryEntrySubmitFailed: 'directory_entry_submit_failed',
  directoryEntryUpdated: 'directory_entry_updated',
  directoryEntryUpdateFailed: 'directory_entry_update_failed',

  // Jobs.
  jobApplicationStarted: 'job_application_started',
  jobSubmitted: 'job_submitted',
  jobSubmitFailed: 'job_submit_failed',
  jobUpdated: 'job_updated',
  jobUpdateFailed: 'job_update_failed',

  // Account and community.
  profileUpdated: 'profile_updated',
  profileUpdateFailed: 'profile_update_failed',
  newsletterSubscribed: 'newsletter_subscribed',
  newsletterSubscriptionFailed: 'newsletter_subscription_failed',
  newsletterUnsubscribed: 'newsletter_unsubscribed',
  contentShared: 'content_shared',
  whatsappCommunityJoinStarted: 'whatsapp_community_join_started',

  // Shared by every form that uploads an image, captured in one place because
  // a failed upload aborts the submission that contained it.
  mediaUploadFailed: 'media_upload_failed',
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

/**
 * Where a directory entry was clicked. Kept apart from EVENT_SURFACE because
 * the two never mix in a breakdown — an entry is never shown on a calendar.
 */
export const ENTRY_SURFACE = {
  homeFeatured: 'home_featured',
  homeLatest: 'home_latest',
} as const

export type EntrySurface = (typeof ENTRY_SURFACE)[keyof typeof ENTRY_SURFACE]

/**
 * Which WhatsApp join link was followed. The community lives on WhatsApp, so
 * these links are scattered across the site and every one of them looks the
 * same in aggregate — the surface is the only way to tell which placement
 * actually recruits people rather than just being present.
 *
 * `footer` appears on every page, so read it against `$current_url` to see
 * where those clicks came from.
 */
export const WHATSAPP_SURFACE = {
  hero: 'hero',
  communitySection: 'community_section',
  communityPage: 'community_page',
  entryDetail: 'entry_detail',
  newsDetail: 'news_detail',
  directory: 'directory',
  footer: 'footer',
} as const

export type WhatsAppSurface =
  (typeof WHATSAPP_SURFACE)[keyof typeof WHATSAPP_SURFACE]

/**
 * Which "go to the directory" link was taken. These compete with the entry
 * cards for the same intent, so they share a vocabulary with them: the point
 * is comparing a browse-everything click against picking a specific entry.
 */
export const DIRECTORY_CTA = {
  hero: 'hero',
  featuredHeader: 'featured_header',
} as const

export type DirectoryCta = (typeof DIRECTORY_CTA)[keyof typeof DIRECTORY_CTA]

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

/**
 * What kind of thing was shared — set by each ShareButton call site. Only the
 * surfaces that actually render a share button are listed; add a value when a
 * button appears rather than in anticipation of one, so an empty breakdown
 * always means "nobody shared it" and never "nobody passed the prop".
 */
export type ShareContentType = 'event' | 'entry'
