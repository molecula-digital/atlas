# PostHog

## Setup

- **Client-only.** No server SDK. Every event is captured in the browser.
- **Proxied.** `NEXT_PUBLIC_POSTHOG_HOST=https://t.molecula.digital` so blockers don't drop it. `NEXT_PUBLIC_POSTHOG_UI_HOST` keeps toolbar links pointing at real PostHog.
- **Production only.** `pnpm dev` captures nothing.

| File | Holds |
|---|---|
| `src/instrumentation-client.ts` | Init. Must stay under `src/`, or it silently never runs. |
| `src/lib/analytics-events.ts` | Every event name + stable property value. |
| `src/lib/analytics.ts` | Capture helpers. |
| `src/components/providers/PostHogIdentify.tsx` | `identify(user.id)` with `email` + `name`; `reset()` on sign-out. |

Auto-captured: `$pageview` (on history change), `$pageleave`, `$autocapture`, `$rageclick`, `$exception`.

## Auth
| Event | Fires when | Properties |
|---|---|---|
| `sign_in_started` | Google button clicked | `provider`, `entry_point`, `callback_url` |
| `signed_in` | Back from Google, session live | `provider`, `is_new_user`, `entry_point` |

One event with a flag, not a separate sign-up — Google is the only provider and sign-in doubles as sign-up.

## Events
All carry `event_slug`, `event_title`, `event_organizer`, `event_is_in_person`, `event_is_past`, `event_has_registration`, plus `surface`.

| Event | Fires when | Extra |
|---|---|---|
| `event_card_clicked` | Card clicked in a listing | `destination` (page/modal) |
| `event_viewed` | Details shown | — |
| `event_registration_started` | Left for the external registration page | — |
| `event_added_to_calendar` | Calendar option picked | `provider` |
| `event_external_link_clicked` | Followed a link off the event | `link_type` (website/maps/meet) |

`event_viewed` exists because the modal never changes the URL, so `$pageview` can't see it.

**Surfaces** — the same calendar renders on `/` and `/eventos`, and telling them apart is the point: `home_upcoming_strip`, `home_calendar`, `home_calendar_sidebar`, `events_page_calendar`, `events_page_calendar_sidebar`, `events_page_past_timeline`, `event_detail_related`, `event_detail_page`, `event_modal`.

## Directory
| Event | Fires when | Properties |
|---|---|---|
| `directory_filter_applied` | Type/city filter changed or cleared | `filter`, `value`, `cleared` |
| `directory_sort_changed` | Sort changed | `sort` |
| `entry_card_clicked` | Entry picked from a home-page listing | `entry_slug`, `entry_name`, `entry_type`, `entry_city`, `surface` |
| `directory_cta_clicked` | Went to browse the whole directory | `cta` |

**Entry surfaces:** `home_featured` (Destacados), `home_latest` (Últimos registros).
**CTAs:** `hero` ("Explorar directorio"), `featured_header` ("Ver todos").

Split one against the other to see whether curating the home page beats just pointing people at the directory.

## Submissions
| Event | Fires when | Properties |
|---|---|---|
| `submit_wizard_started` | Wizard mounts | — |
| `submit_wizard_step_completed` | Step advanced | `step_index`, `step_name`, `next_step_index`, `total_steps`, `entry_type` |
| `submit_wizard_abandoned` | Left without submitting | `last_step_index`, `last_step_name`, `total_steps` |
| `directory_entry_submitted` | Entry created | `entry_type`, `has_images`, `tag_count` |
| `directory_entry_submit_failed` | Create rejected | `entry_type`, `has_images`, + failure props |
| `directory_entry_updated` | Entry edited | `entry_type` |
| `directory_entry_update_failed` | Edit rejected | `entry_type`, + failure props |

Abandonment fires on unmount *and* `pagehide`, since tab close and refresh never run a React cleanup. Back/forward cache is excluded — those users usually come back.

## Jobs
| Event | Fires when | Properties |
|---|---|---|
| `job_application_started` | Apply clicked | `job_slug`, `job_title`, `job_company`, `job_modality` |
| `job_submitted` | Posting created | `job_type`, `modality`, `has_city`, `has_compensation` |
| `job_submit_failed` | Create rejected | same, + failure props |
| `job_updated` | Posting edited | `job_type`, `modality` |
| `job_update_failed` | Edit rejected | same, + failure props |

## Account & community
| Event | Fires when | Properties |
|---|---|---|
| `profile_updated` | Profile saved | `is_public` |
| `profile_update_failed` | Save rejected | failure props |
| `newsletter_subscribed` | Signup succeeded | `source` (homepage/footer) |
| `newsletter_subscription_failed` | Signup rejected | `source`, + failure props |
| `newsletter_unsubscribed` | Unsubscribe succeeded | `method` (email_link/form) |
| `content_shared` | Shared or copied a link | `method`, `content_type`, `content_id` |
| `whatsapp_community_join_started` | WhatsApp CTA clicked | — |
| `media_upload_failed` | Image rejected, at validation or upload | `stage`, `file_type`, `file_size`, + failure props |

A failed upload aborts the submission holding it, so without `media_upload_failed` that drop-off looks like someone changing their mind.

## Failure props

Every `*_failed` event also carries:

- `status` — HTTP status, or `null` when no response came back
- `reason` — the API's error string. A diagnostic to read, not a dimension to chart; the wording can change.
- `failure_kind` — `response` (server said no), `network` (never reached it), `validation` (rejected before sending)

## Adding an event

1. Add the name to `ANALYTICS_EVENTS`. Never inline a string.
2. Property *values* come from the constants too, never from UI copy — renaming a button must not split a metric.
3. Entity properties go in one helper per entity in `analytics.ts`, so a chart grouped by `entry_slug` keeps working whatever fires it.
4. If a component can mount in more than one place, make `surface` a **required** prop. Optional tracking props get forgotten.

Renaming a value renames it in PostHog and orphans the history behind the old name. Add a new key instead.
