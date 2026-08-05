# Entry Popularity & Hits

**Date:** 2026-08-05
**Status:** Draft
**Scope:** Directory entries (`startup`, `community`, `business`, `consultory`, `research-center`, `person`) and public profiles that appear in `/personas`

## Summary

Add a first-party **hit / popularity** system so Atlas can tell which directory entries attract attention — and distinguish **first-time visitors** from **people coming back** — without treating raw page loads as a popularity score.

Today engagement lives only in PostHog (`$pageview`, partial `entry_card_clicked`) and Umami. Neither can power directory sorting or owner-facing stats. This design introduces durable visit records, rolled-up counters, and a derived popularity score used for ranking.

## Motivation

- Owners and editors ask “which startups / communities get the most interest?”
- Directory sorting is date / name / random only; `featured` is manual curation
- Home `entry_card_clicked` undercounts discovery because directory `EntryCard` and detail suggestions are untracked
- `$pageview` on `/startups/[slug]` is a weak proxy: bots, refreshes, and shared links inflate it; returns are invisible
- Outbound “Visitar sitio” uses UTM params for the destination, but Atlas never records the click

## Goals

1. Record meaningful engagement on entries (views, returns, outbound interest)
2. Separate **new visitors** (first time for this entry) from **recurring visitors** (seen this entry before)
3. Expose a **popularity** sort in the directory (and optionally surface scores to owners later)
4. Keep PostHog as the product-analytics layer; first-party data is for ranking + durable metrics
5. Resist trivial inflation (refresh spam, scrapers, self-hits)

## Non-goals (v1)

- Replacing PostHog or Umami
- Impression tracking for every card in a grid (expensive; defer)
- Real-time live counters on the public detail page
- Fingerprinting / invasive device ID
- Ranking public profiles with a different formula than Payload entries (same visitor model; same rollups)
- Showing raw hit numbers publicly by default (owners/admins only until we decide otherwise)

## Definitions

| Term | Meaning |
|---|---|
| **Hit** | One counted engagement event that passed dedupe / anti-abuse rules |
| **Detail view** | Visitor opened the entry detail page (`/[category]/[slug]`) |
| **Outbound click** | Visitor followed “Visitar sitio” (or equivalent external primary link) |
| **Visitor** | Anonymous `visitor_id` cookie, or logged-in `user_id` when present |
| **New visitor (per entry)** | First time this visitor has a counted detail view for this entry |
| **Recurring visitor (per entry)** | Visitor with a prior counted detail view for this entry |
| **New to Atlas** | Optional secondary flag: visitor’s first counted detail view on *any* entry (site-wide cold start) |
| **Popularity** | Derived score from recent unique detail views + outbound clicks, with mild recency bias — **not** raw hit count |

Important: “new vs recurring” is **per entry**, not “new Atlas account.” Most directory traffic is anonymous and never signs in.

## Design principles

1. **Count people, not reloads.** Uniques matter more than raw hits for ranking.
2. **Signal hierarchy.** Outbound click > recurring return > first detail view > card click. Card clicks alone must not dominate popularity (discovery ≠ interest).
3. **First-party for ranking.** PostHog is great for funnels; Postgres owns sort keys.
4. **Client fires intent; server decides credit.** The browser reports a view/click; the API applies dedupe and increments rollups.
5. **Do not confuse with `featured` or `memberCount`.** Featured stays editorial. Community `memberCount` stays self-reported size.

## Architecture

```
Browser                         Atlas API                      Postgres (app schema)
───────                         ─────────                      ─────────────────────
detail mount ──POST /api/hits──► validate + dedupe ──► entry_hits (append)
outbound click ──POST /api/hits► classify new/return ──► entry_stats (rollup)
                                 update popularityScore
PostHog (parallel): entry_viewed, entry_outbound_clicked, entry_card_clicked
```

PostHog stays client-only (existing rule). The hit API is the **one intentional exception** for server-side recording, because ranking needs authoritative counters.

### Why not PostHog-only?

- Cannot sort `GET /api/directory/entries` by a PostHog insight without fragile ETL
- Ad blockers / failed beacons undercount unevenly across entries
- No transactional link to `payload.entries` IDs
- Recurring-per-entry requires a visitor→entry history we control

## Visitor identity

### `visitor_id` (required for counting)

- First-party cookie: `atlas_vid`
- UUID v4, HttpOnly, Secure, SameSite=Lax, path `/`, max-age ~1 year
- Set by the hit API (or a tiny middleware) on first hit if missing
- Not a login; survives across sessions for “returning to this entry”

### `user_id` (optional)

- If better-auth session exists, store `user_id` on the hit row
- Prefer merging: when a previously anonymous `visitor_id` later signs in, future hits carry both; do **not** rewrite history in v1
- Owners viewing their own entry: **do not credit** detail views or outbound clicks from the entry `owner` (and optionally from Payload admins)

### What we explicitly reject (v1)

- Canvas / WebGL fingerprinting
- Relying on IP alone as identity (NAT, mobile carriers)
- Counting Umami pageviews into popularity

IP may be hashed into a short-lived dedupe key only (see Anti-abuse).

## Event taxonomy

### First-party hit kinds

| `kind` | Fired from | Counts toward popularity? |
|---|---|---|
| `detail_view` | Entry detail page mount (client) | Yes (unique, deduped) |
| `outbound_click` | “Visitar sitio” / primary external CTA | Yes (stronger weight) |
| `card_click` | Optional v1.1 — directory / home / suggestions | No for score; analytics + funnel only |

v1 ships `detail_view` + `outbound_click`. Extend `entry_card_clicked` PostHog surfaces first; first-party `card_click` can wait until we need funnel joins in SQL.

### PostHog (product analytics, same PR or follow-up)

| Event | When | Notes |
|---|---|---|
| `entry_viewed` | Detail page shown | Like `event_viewed`; `$pageview` alone is insufficient for entry-scoped charts |
| `entry_outbound_clicked` | External primary link | `link_type: website` (extend later) |
| `entry_card_clicked` | Expand surfaces | Add `directory`, `category`, `city`, `detail_related` to `ENTRY_SURFACE` |

Keep PostHog and first-party hits independent: either can fail without breaking the other.

## Data model

Place tables in the Drizzle `app` schema (alongside `profiles`), not Payload fields that editors can edit.

### `app.entry_hits` (append-only facts)

```ts
entry_hits = {
  id: uuid PK
  entryId: text not null          // Payload entries.id as text, or `profile:<userId>` for public profiles
  entryType: text not null        // denormalized for filters
  kind: text not null             // detail_view | outbound_click | card_click
  visitorId: text not null        // atlas_vid
  userId: text null               // better-auth user id
  isNewVisitor: boolean not null  // first credited detail_view for this entry+visitor
  surface: text null              // optional; mainly for card_click
  createdAt: timestamptz not null default now()
}
```

Indexes:
- `(entryId, kind, createdAt)` — rollups / windows
- `(entryId, visitorId, kind)` — uniqueness checks
- `(visitorId, createdAt)` — per-visitor history
- Partial unique for “one credited detail_view per visitor per entry per calendar day” (see Dedupe)

### `app.entry_stats` (rollup per entry)

```ts
entry_stats = {
  entryId: text PK
  // Lifetime
  detailViews: int not null default 0           // credited hits
  uniqueVisitors: int not null default 0        // distinct visitors with ≥1 detail_view
  newVisitors: int not null default 0           // detail_views where isNewVisitor
  returningVisitors: int not null default 0     // credited detail_views where !isNewVisitor (hit count) OR better: unique returners — pick one and document
  outboundClicks: int not null default 0
  uniqueOutboundVisitors: int not null default 0
  // Windows (maintained on write or by job)
  uniqueVisitors7d: int not null default 0
  uniqueVisitors30d: int not null default 0
  outboundClicks7d: int not null default 0
  // Score
  popularityScore: double precision not null default 0
  popularityUpdatedAt: timestamptz
  updatedAt: timestamptz not null
}
```

Clarify returning metric for v1 UI:

- **`returningVisitorHits`**: credited `detail_view` rows with `isNewVisitor = false`
- **`uniqueReturningVisitors`**: distinct visitors with ≥2 lifetime credited detail days (or ≥1 return after first)

Expose both in admin/owner stats; use **unique windows** for the score.

### Why not columns on `payload.entries`?

- Keeps counters out of CMS forms (editors must not edit popularity)
- Avoids Payload versioning noise on every hit
- Public profiles are not Payload rows — shared `entryId` namespace covers both

Denormalize `popularityScore` onto a read path the directory API can join/sort (stats table join, or periodic copy into a Payload read-only field later if needed). Prefer join/order via SQL for `popularity` sort, matching the existing `random` SQL path.

## Dedupe & anti-abuse

Credit a `detail_view` only when **all** pass:

1. Entry exists and `_status = published` (or public profile `isPublic`)
2. Actor is not the entry `owner`
3. Same `(entryId, visitorId, kind=detail_view)` has no credited hit in the last **6 hours** (session refresh / tab spam)
4. Optional soft cap: max **N** credited detail_views per `visitorId` per day across all entries (e.g. 40) to blunt scrapers
5. Rate-limit `POST /api/hits` (existing `withRateLimit`, tighter than directory GETs — e.g. 30/min/IP)
6. Ignore obvious bots via `Sec-CH-UA` / UA heuristics lightly; do not rely on this alone
7. Require `Origin` / `Referer` same-site for hit POSTs

For `outbound_click`:

- Credit at most once per `(entryId, visitorId)` per **24 hours**
- Still require a recent detail view from the same visitor (e.g. within 2 hours) so hotlink scripts cannot inflate outbound without viewing

`isNewVisitor`:

- `true` iff this is the first **credited** `detail_view` for `(entryId, visitorId)` ever
- Subsequent credited views set `isNewVisitor = false` (recurring)

## Popularity score

### Formula (v1)

Use a **7-day window** as the primary ranking signal so new entries can surface and old evergreen pages do not monopolize forever.

```
score =
  1.0 * unique_detail_visitors_7d
+ 0.5 * unique_returning_visitors_7d   // subset of uniques who had a prior lifetime visit
+ 2.0 * unique_outbound_visitors_7d
+ 0.15 * unique_detail_visitors_30d   // light long-tail stability
```

Notes:

- Returning weight is **extra** on top of unique detail (returning visitors are already in `unique_detail_visitors_7d`)
- Outbound is the strongest interest signal
- No card-click term in v1
- Clamp / floor at 0; store as float

Recompute on each credited hit (cheap incremental updates for lifetime counters; window counters via SQL counts or incremental approximations). If window recompute is too heavy under load, batch every 5–15 minutes with a job — v1 can recompute windows with a single constrained query per hit while traffic is small.

### Cold start

- New entries start at 0; date-desc remains default sort
- `featured` stays manual boost on the home page; do **not** auto-feature from score
- Optional later: `score + small age decay` or explore boost for entries `< 14 days` — out of v1

## API

### `POST /api/hits`

Body:

```ts
{
  entryId: string
  kind: 'detail_view' | 'outbound_click'
  // entryType optional if server can resolve; send for profiles
}
```

Behavior:

- Resolve / set `atlas_vid`
- Auth session → optional `user_id`
- Apply dedupe rules; if not credited, return `{ credited: false, reason }` with 200 (not an error)
- If credited, insert hit, update stats, return `{ credited: true, isNewVisitor }`
- Never return other visitors’ data

Rate-limited. No GET. No public read of raw hits.

### Directory sort

Extend `SORT_MAP` / filter UI:

| Key | Behavior |
|---|---|
| `popularity` | `ORDER BY entry_stats.popularity_score DESC NULLS LAST, publish_date DESC` |

Label (ES): “Más populares” — tooltip/helper: based on recent interest, not total lifetime hits.

Default sort stays `date-desc`.

### Owner / admin read (v1.1 or same PR if cheap)

`GET /api/user/entries` (or dashboard card) may include:

- `uniqueVisitors30d`, `newVisitors` (lifetime), `returningVisitorHits`, `outboundClicks30d`, `popularityScore`

Do not show vanity lifetime raw hits as the headline metric.

## Frontend hooks

1. **Detail page** (`[category]/[slug]/page.tsx`): client effect posts `detail_view` once per mount; fire `entry_viewed` to PostHog
2. **Outbound CTA**: on click, `navigator.sendBeacon` / `fetch(keepalive)` `outbound_click`, then navigate; fire `entry_outbound_clicked`
3. **Directory sort control**: add `popularity` option; wire `directory_sort_changed`
4. **EntryCard PostHog**: pass `surface` (directory / category / …) — analytics completeness, independent of score

Avoid blocking LCP: hit POST after hydration, fire-and-forget.

## Privacy & compliance posture

- `visitor_id` is a first-party functional cookie for measuring interest in listed organizations
- Store no payload of page content; no exact IP column in v1 (if needed for abuse, store short HMAC with rotating daily key, not raw IP)
- Retention: raw `entry_hits` retain **90 days**; rollups keep lifetime aggregates
- Document in privacy policy when cookie is introduced
- Honor a future opt-out only if product requires it; v1 treats this as essential measurement for the directory

## Rollout plan

### Phase 1 — Instrumentation + storage (no UI ranking)

- Schema + `POST /api/hits`
- Detail view + outbound click wiring
- PostHog `entry_viewed` / `entry_outbound_clicked` + expanded card surfaces
- Admin-only SQL / lightweight internal check that counters move

### Phase 2 — Popularity sort

- Maintain `popularityScore`
- Add “Más populares” to directory sorts
- Verify against known busy entries; watch for self-hit / bot skew

### Phase 3 — Owner-facing stats (optional)

- Dashboard widgets: new vs returning (30d), outbound interest
- Still hide raw numbers on public pages unless product asks

## Open questions

1. **Public display:** Show a subtle “interest” indicator on cards, or keep metrics private?
2. **Person entries vs profiles:** Confirm single `entryId` namespace (`123` vs `profile:abc`) is acceptable for sorts that merge both on `/personas`.
3. **Window length:** 7d primary vs 14d if traffic is sparse early on.
4. **Incremental vs job:** Recompute 7d/30d windows per hit or nightly/cron once volume grows?
5. **Card clicks in score:** Only if we later prove detail views alone miss “intent” for communities that have weak websites.

## Decision checklist (for approval)

- [ ] Approve first-party `atlas_vid` + `app.entry_hits` / `app.entry_stats`
- [ ] Approve new-vs-recurring = **per entry**, based on credited detail views
- [ ] Approve score formula weights (unique 7d, returning bonus, outbound 2×)
- [ ] Approve Phase 1 → 2 rollout (instrument before public sort)
- [ ] Decide public vs owner-only visibility of numbers

## Implementation sketch (after approval)

| Area | Touch |
|---|---|
| Drizzle | `src/db/schema/entry-stats.ts` (+ migration) |
| API | `src/app/api/hits/route.ts` |
| Lib | `src/lib/entry-hits.ts` (credit, score, owner exclusion) |
| Detail | client beacon on `[category]/[slug]` |
| Outbound | wrap “Visitar sitio” |
| Directory | `sort=popularity` in route + `useDirectoryFilters` |
| Analytics | `analytics-events.ts` + docs/posthog.md |
| Cookie | set `atlas_vid` on credited or attempted hits |

## Appendix: what exists today

| Piece | Role today | Role after |
|---|---|---|
| PostHog `$pageview` | Approximate detail traffic | Keep; add `entry_viewed` |
| `entry_card_clicked` | Home only | Expand surfaces |
| Umami | Cookieless totals | Unchanged; not for ranking |
| `featured` | Editorial home rail | Unchanged |
| `memberCount` | Community self-report | Unchanged |
| UTM `buildTrackedUrl` | Destination attribution | Keep; add Atlas `outbound_click` |
