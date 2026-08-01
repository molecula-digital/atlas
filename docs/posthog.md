# PostHog

## Setup

- **Client-only.** No server SDK. Every event is captured in the browser.
- **Proxied.** `NEXT_PUBLIC_POSTHOG_HOST=https://t.molecula.digital` so blockers don't drop it. `NEXT_PUBLIC_POSTHOG_UI_HOST` keeps toolbar links pointing at real PostHog.
- **Production only.** `pnpm dev` captures nothing, so dev traffic never lands in the project.

Init lives in `src/instrumentation-client.ts` (must be under `src/`, or it silently never runs).

## Files

| File | Holds |
|---|---|
| `src/lib/analytics-events.ts` | Every event name + stable property values. No posthog import, so servers can read it. |
| `src/lib/analytics.ts` | Capture helpers. `'use client'`. |
| `src/components/providers/PostHogIdentify.tsx` | Ties PostHog identity to the Better Auth session. |

## Auto-captured

`$pageview` (on history change, not just document load), `$pageleave`, `$autocapture`, `$rageclick`, `$exception`.

## Identity

`PostHogIdentify` calls `identify(user.id)` and sets `email` and `name` as person properties. `reset()` on sign-out and on account switch.

## What we track

### Auth
| Event | Fires when | Properties |
|---|---|---|
| `sign_in_started` | Google button clicked | `provider`, `entry_point`, `callback_url` |
| `signed_in` | Back from Google, session live | `provider`, `is_new_user`, `entry_point` |

One event with a flag, not separate sign-up — Google is the only provider and sign-in doubles as sign-up.

### Events
All carry `event_slug`, `event_title`, `event_organizer`, `event_is_in_person`, `event_is_past`, `event_has_registration`, plus `surface`.

| Event | Fires when | Extra |
|---|---|---|
| `event_card_clicked` | Card clicked in a listing | `destination` (page/modal) |
| `event_viewed` | Details shown | — |
| `event_registration_started` | Left for the external registration page | — |
| `event_added_to_calendar` | Calendar option picked | `provider` |
| `event_external_link_clicked` | Followed a link off the event | `link_type` (website/maps/meet) |

`event_viewed` exists because the modal never changes the URL, so `$pageview` can't see the most common way an event gets read.

**Surfaces** — the same calendar renders on `/` and `/eventos`; telling them apart is the point: `home_upcoming_strip`, `home_calendar`, `home_calendar_sidebar`, `events_page_calendar`, `events_page_calendar_sidebar`, `events_page_past_timeline`, `event_detail_related`, `event_detail_page`, `event_modal`.

### Directory
| Event | Fires when | Properties |
|---|---|---|
| `directory_filter_applied` | Type/city filter changed or cleared | `filter`, `value`, `cleared` |
| `directory_sort_changed` | Sort changed | `sort` |
| `entry_card_clicked` | Entry picked from a home-page listing | `entry_slug`, `entry_name`, `entry_type`, `entry_city`, `surface` |
| `directory_cta_clicked` | Went to browse the whole directory | `cta` |

**Entry surfaces:** `home_featured` (Destacados tiles, grid and mobile carousel), `home_latest` (Últimos registros strip).

**Directory CTAs:** `hero` ("Explorar directorio"), `featured_header` ("Ver todos").

These two answer one question together: does curating entries on the home page beat just pointing people at the directory? Compare `entry_card_clicked` split by `surface` against `directory_cta_clicked` split by `cta`.

### Submissions
| Event | Fires when | Properties |
|---|---|---|
| `submit_wizard_started` | Wizard mounts | — |
| `submit_wizard_step_completed` | Step advanced | `step_index`, `step_name`, `next_step_index`, `total_steps`, `entry_type` |
| `submit_wizard_abandoned` | Left without submitting | `last_step_index`, `last_step_name`, `total_steps` |
| `directory_entry_submitted` | Entry created | `entry_type`, `has_images`, `tag_count` |
| `directory_entry_submit_failed` | Create rejected | `entry_type`, `has_images`, + failure props |
| `directory_entry_updated` | Entry edited | `entry_type` |
| `directory_entry_update_failed` | Edit rejected | `entry_type`, + failure props |

Abandonment fires on `pagehide` as well as unmount — tab close and refresh never run a React cleanup, and those are the usual way people give up. It skips `pagehide` with `persisted: true` (page went to the back/forward cache, e.g. switching apps on iOS), since those users usually come back and would otherwise be counted as both abandoned and converted.

### Jobs
| Event | Fires when | Properties |
|---|---|---|
| `job_application_started` | Apply clicked | `job_slug`, `job_title`, `job_company`, `job_modality` |
| `job_submitted` | Posting created | `job_type`, `modality`, `has_city`, `has_compensation` |
| `job_submit_failed` | Create rejected | `job_type`, `modality`, `has_city`, `has_compensation`, + failure props |
| `job_updated` | Posting edited | `job_type`, `modality` |
| `job_update_failed` | Edit rejected | `job_type`, `modality`, + failure props |

### Account & community
| Event | Fires when | Properties |
|---|---|---|
| `profile_updated` | Profile saved | `is_public` |
| `profile_update_failed` | Save rejected | failure props |
| `newsletter_subscribed` | Signup succeeded | `source` (homepage/footer) |
| `newsletter_subscription_failed` | Signup rejected | `source`, + failure props |
| `newsletter_unsubscribed` | Unsubscribe succeeded | `method` (email_link/form) |
| `content_shared` | Shared or copied a link | `method`, `content_type`, `content_id` |
| `whatsapp_community_join_started` | WhatsApp CTA clicked | — |

### Uploads
| Event | Fires when | Properties |
|---|---|---|
| `media_upload_failed` | Image rejected, at validation or upload | `stage`, `file_type`, `file_size`, + failure props |

Captured in `uploadMediaFile`, which every image upload goes through, plus the profile photo form, which validates before calling it. A failed upload aborts the submission holding it — without this, that drop-off looks like someone changing their mind.

## Failures

"Failure props" above means every `*_failed` event also carries:

- `status` — HTTP status, or `null` when no response was received
- `reason` — the API's error string. Read it, don't build metrics on it; the wording can change.
- `failure_kind` — `response` (server said no), `network` (never reached it), or `validation` (we rejected it before sending)

## Adding an event

1. Add the name to `ANALYTICS_EVENTS`. Never inline a string.
2. If it's about an entity, add a helper to `analytics.ts` that builds the properties — so a chart grouped by `event_slug` keeps working whatever fires it.
3. Property *values* come from the constants too, never from UI copy. Renaming a button must not split a metric.
4. If a component can be mounted in more than one place, pass `surface` as a **required** prop. Optional tracking props get forgotten — that's how desktop registrations went uncounted for a release.

Renaming a value renames it in PostHog and orphans the history behind the old name. Add a new key instead.
