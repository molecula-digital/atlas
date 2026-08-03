# Architecture Improvements — Implementation Plans

Date: 2026-03-31

---

## Plan 1: Consolidate PostgreSQL Connection Pools (#18)

**Problem**: Three separate `pg.Pool` instances connect to the same database — one in `payload.config.ts` (via `postgresAdapter`), one in `src/lib/auth.ts` (better-auth), and one in `src/db/index.ts` (Drizzle). This wastes connections and makes it harder to tune pool limits, especially on managed databases with low connection caps.

**Files to modify**:
- `src/db/pool.ts` (new — shared pool module)
- `src/db/index.ts`
- `src/lib/auth.ts`
- `payload.config.ts`

**Implementation steps**:
1. Create `src/db/pool.ts` that exports a single `pg.Pool` instance configured from `DATABASE_URL`. Set explicit `max` (e.g. 20), `idleTimeoutMillis` (30 000), and `connectionTimeoutMillis` (5 000). This is the only file that should ever call `new Pool()`.
2. In the same file, export a helper `getPoolWithSchema(schema: string)` that wraps the pool's `connect()` to run `SET search_path TO <schema>, public` on each connection. This is needed because better-auth uses the `auth` schema while Payload uses the `payload` schema.
3. Update `src/lib/auth.ts`: remove the local `new Pool()` and import the shared pool from `src/db/pool.ts`. Pass it through `getPoolWithSchema('auth')` or keep the existing `pool.on('connect')` pattern but sourced from the shared pool. **Note**: better-auth accepts a `pg.Pool` directly, so the shared pool can be passed as-is if the `connect` event handler is moved to the shared module.
4. Update `src/db/index.ts`: remove the local `new Pool()` and import the shared pool. Pass it to `drizzle(pool, { schema })`.
5. Update `payload.config.ts`: the `postgresAdapter` accepts a `pool` option that can be either a connection string or a `Pool` instance. Change from `{ pool: { connectionString } }` to `{ pool: { pool: sharedPool } }` (check the Payload adapter docs — the adapter may need the raw pool object or a `poolConfig`). **Caveat**: Payload's `postgresAdapter` in v3 creates its own pool internally; verify whether it accepts an existing `Pool` instance. If not, the alternative is to reduce `max` on the Payload pool and share the remaining budget between auth and Drizzle.
6. Add a `POOL_MAX` environment variable (default 20) and split the budget: e.g. Payload gets 10, shared pool for auth+Drizzle gets 10. Document this in `.env.example`.
7. Add a startup log line that prints the pool configuration for observability.

**Migration steps**:
- Deploy the shared pool module first with no consumers.
- Switch Drizzle to the shared pool (lowest risk).
- Switch better-auth to the shared pool.
- Switch Payload last (highest risk — test admin panel and API thoroughly).
- Monitor connection count via `pg_stat_activity` after each step.

**Estimated complexity**: M

**Dependencies**: None

---

## Plan 2: Optimize Data Fetching (#19, #20, #22)

**Problem**: The home page calls `getPublishedEntries()` which fetches up to 200 full documents just to count them by type and city. The `/api/entries/counts` route similarly loads all docs with `pagination: false` and counts in JavaScript. The directorio pages use random sort by fetching everything and shuffling client-side. All three patterns are O(n) in document count and transfer far more data than needed.

**Files to modify**:
- `src/lib/entry-counts.ts` (new — dedicated counts function)
- `src/app/api/entries/counts/route.ts`
- `src/app/(frontend)/page.tsx`
- `src/lib/utils.ts` (remove or deprecate `countByType`, `groupByCity`, `countByTypeAndCity`)
- `src/app/(frontend)/directorio/page.tsx`
- `src/app/(frontend)/directorio/[city]/page.tsx`

**Implementation steps**:

### A. GROUP BY counts via raw SQL
1. Create `src/lib/entry-counts.ts` with a `getEntryCounts()` function that uses the Drizzle `db` instance (from `src/db/index.ts`) to execute raw SQL:
   ```sql
   SELECT entry_type, city, COUNT(*)::int AS count
   FROM payload.entries
   WHERE _status = 'published'
   GROUP BY entry_type, city
   ```
   Parse the result into `{ byType: Record<string, number>, byCity: Record<string, number>, byCityAndType: Record<string, Record<string, number>>, total: number }`. Handle the `global` city fan-out in code (add global counts to every city).
2. This single query replaces all three utility functions (`countByType`, `groupByCity`, `countByTypeAndCity`) and eliminates loading 200 full documents.
3. Cache the result with `React.cache()` for the duration of a single request, or use `unstable_cache` with a 60-second revalidation tag for ISR.

### B. Update `/api/entries/counts`
4. Rewrite `src/app/api/entries/counts/route.ts` to call `getEntryCounts()` instead of loading all docs. Return the same JSON shape for backward compatibility.

### C. Update home page
5. In `src/app/(frontend)/page.tsx`, replace `getPublishedEntries()` with `getEntryCounts()`. The home page only needs counts and the featured entries (which are already fetched separately). Remove the `allEntries` variable entirely.
6. Update `HeroSection`, `CategorySection`, and `MapSection` props to accept the new counts shape. These components already receive pre-computed count objects, so the change is at the call site.

### D. Database-level random sort
7. For the directorio page's "random" display, use Payload's `sort` option or a raw SQL `ORDER BY RANDOM() LIMIT 18` via Drizzle. This avoids fetching the entire collection.
8. If using Payload's API, there is no native random sort — use a raw Drizzle query with `ORDER BY RANDOM()` and `LIMIT` for the directorio page, or fetch a page-sized batch with a random offset.

**Estimated complexity**: M

**Dependencies**: Plan 1 (shared pool) is recommended first so that raw SQL queries go through the same pool, but not strictly required — Drizzle already has its own pool.

---

## Plan 3: Entry Detail Page Suggestions (#19 continued)

**Problem**: `src/app/(frontend)/[category]/[slug]/page.tsx` calls `getPublishedEntries()` (200 docs) just to pick 3 suggestions. This fetches all fields of all entries on every detail page view.

**Files to modify**:
- `src/lib/payload.ts` (add `getSuggestions` function)
- `src/app/(frontend)/[category]/[slug]/page.tsx`

**Implementation steps**:
1. Add a `getSuggestedEntries(entryId: string, entryType: string, city: string)` function in `src/lib/payload.ts` that performs two targeted Payload queries:
   - Query 1: Same `entryType`, exclude current `id`, `limit: 3`, `sort: '-publishDate'`, select only card-relevant fields (`slug`, `name`, `tagline`, `entryType`, `logo`, `coverImage`, `city`, `tags`).
   - Query 2 (only if Query 1 returned fewer than 3): Same `city`, exclude current `id` and IDs already found, `limit: 3 - foundSoFar`, select same fields.
   - If still fewer than 3, do a third query with no filters (exclude already-found IDs), `limit: 3 - foundSoFar`.
2. Use `select` on each query to avoid fetching `body`, `description`, and other heavy fields.
3. In the detail page component, replace:
   ```ts
   const allResult = await getPublishedEntries()
   const others = allResult.docs.filter(...)
   ```
   with:
   ```ts
   const suggestions = await getSuggestedEntries(entry.id, entry.entryType, entry.city)
   ```
4. Early exit: if `entryType` query already returns 3 results, skip the subsequent queries.
5. Wrap with `React.cache()` so that if multiple components on the same page request suggestions, the query is deduplicated.
6. Optional future improvement: add `unstable_cache` with a tag like `suggestions:${entryType}:${city}` and revalidate on entry publish.

**Estimated complexity**: S

**Dependencies**: None

---

## Plan 4: Jobs Page ISR (#21)

**Problem**: `/empleos/[slug]` uses `export const dynamic = 'force-dynamic'`, meaning every page view hits the database. Job listings are relatively static content that only needs to update when a job is published, edited, or expires.

**Files to modify**:
- `src/app/(frontend)/empleos/[slug]/page.tsx`
- `src/collections/Jobs.ts` (revalidation hook, if not already covering this path)

**Implementation steps**:
1. Remove `export const dynamic = 'force-dynamic'` from `src/app/(frontend)/empleos/[slug]/page.tsx`.
2. Add `export const revalidate = 3600` (1 hour) for time-based ISR. This ensures expired jobs are caught within an hour even without an explicit revalidation trigger.
3. Add `generateStaticParams()` that fetches active jobs and returns their slugs:
   ```ts
   export async function generateStaticParams() {
     const result = await getActiveJobs()
     return result.docs.map((job) => ({ slug: job.slug }))
   }
   ```
4. Handle expired jobs gracefully in the page component. After fetching the job, check `expiresAt`:
   - If the job is expired, either show a "This job listing has expired" banner (preferred, so inbound links don't break) or call `notFound()`.
   - If showing a banner, add a `<meta name="robots" content="noindex">` to prevent indexing expired jobs.
5. Verify the existing `revalidateEntry` hook in `src/collections/Jobs.ts` calls `revalidatePath('/empleos/[slug]')` or `revalidateTag`. If not, add `revalidatePath(`/empleos/${doc.slug}`)` to the `afterChange` hook so that when a job is published or updated in the admin panel, the ISR cache is invalidated.
6. Consider also adding `revalidatePath('/empleos')` to the hook so the jobs listing page also refreshes.

**Estimated complexity**: S

**Dependencies**: None

---

## Plan 5: Image Upload for Submissions (#23)

**Problem**: The submit wizard in `StepReview.tsx` collects logo and cover image files via `<input type="file">`, generates local preview URLs, but the `buildPayload()` function in `useWizardState.ts` never includes the image data. The submission is JSON-only (`Content-Type: application/json`), so images are silently dropped.

**Files to modify**:
- `src/components/forms/submit-wizard/useWizardState.ts`
- `src/components/forms/submit-wizard/StepReview.tsx`
- `src/app/api/submissions/entries/route.ts`
- `src/app/api/media/upload/route.ts` (new — media upload endpoint for better-auth users)

**Implementation steps**:

### Approach A: Upload images first, then submit entry (recommended)
This approach is cleaner because the entry submission stays JSON-only, and images are handled as a separate concern.

1. **Create a media upload API route** at `src/app/api/media/upload/route.ts`:
   - Accept `multipart/form-data` with a single file field.
   - Require a valid better-auth session (`getServerSession()`).
   - Use the Payload client to create a media document: `payload.create({ collection: 'media', data: { alt: filename }, file: { data: buffer, mimetype, name, size } })`.
   - Return `{ id: media.id, url: media.url }`.
   - Payload's `media` collection has `create: isAdminOrModerator` access — this needs to be relaxed for authenticated users, or the upload route should use Payload's `overrideAccess: true` (acceptable since we've already verified the session).

2. **Update `useWizardState.ts`**:
   - Change `buildPayload()` to accept optional `logoId` and `coverImageId` parameters.
   - Add these to the returned object: `logo: logoId || undefined`, `coverImage: coverImageId || undefined`.
   - Update the `submit` function: before sending the entry JSON, upload each selected file to `/api/media/upload`, collect the returned IDs, then include them in the entry payload.

3. **Update `StepReview.tsx`**:
   - Add upload progress indicators (a spinner or progress bar) next to each image preview.
   - If upload fails, show an inline error and allow retry.

4. **Update the entry submission route** (`src/app/api/submissions/entries/route.ts`):
   - `logo` and `coverImage` are already in `ENTRY_ALLOWED_FIELDS`. The Payload `create` call will accept media IDs (relationship fields). No changes needed here beyond verifying it works.

### Approach B: FormData submission (alternative)
Convert the entire submission to `FormData` instead of JSON. This avoids a separate upload step but requires refactoring the API route to parse multipart data and creates a more complex request.

1. In `useWizardState.ts`, change `submit()` to build a `FormData` object instead of calling `JSON.stringify()`.
2. Update the API route to parse `FormData`, extract files, upload them to Payload media, get their IDs, and then create the entry with those IDs.

**Recommendation**: Approach A is preferred — it keeps concerns separated and is easier to test.

### Auth considerations
- The Payload `media` collection restricts `create` to `isAdminOrModerator`. The new upload route should use `overrideAccess: true` since it already enforces better-auth authentication. This is safe because the route validates the session before accepting the upload.
- Add file size validation (e.g. max 5 MB) and file type validation (only image MIME types) in the upload route.
- Consider rate limiting uploads to prevent abuse (see Plan 8).

**Estimated complexity**: M

**Dependencies**: None (but Plan 8 rate limiting is recommended before deploying to production)

---

## Plan 6: Job Editing from Dashboard (#24)

**Problem**: Users can submit jobs via `POST /api/submissions/jobs` but cannot edit pending (draft) jobs. The `MyJobs` component in the dashboard shows jobs but has no edit action, and the API route has no `PATCH` handler.

**Files to modify**:
- `src/app/api/submissions/jobs/route.ts` (add PATCH and GET handlers)
- `src/app/(frontend)/dashboard/jobs/[id]/edit/page.tsx` (new — edit page)
- `src/components/dashboard/MyJobs.tsx` (add edit button for draft jobs)

**Implementation steps**:

1. **Add a PATCH handler to `src/app/api/submissions/jobs/route.ts`**:
   - Require a valid better-auth session.
   - Accept `{ id, ...fields }` in the request body.
   - Fetch the existing job by ID, verify `job.postedBy === session.user.id`.
   - Only allow editing if the job is in `draft` status (pending review). Published jobs should not be editable by users — they should contact a moderator.
   - Use an allowlist of editable fields (same as `JOB_ALLOWED_FIELDS` minus `slug` and `postedBy`): `title`, `description`, `type`, `modality`, `city`, `compensation`, `tags`, `contactUrl`, `entry`, `expiresAt`.
   - Call `payload.update({ collection: 'jobs', id, data: { ...pickedFields, _status: 'draft' } })`.
   - Return `{ success: true }`.

2. **Add a GET handler** for fetching a single job for editing:
   - Accept `?id=xxx` query parameter.
   - Verify session and ownership (`postedBy === session.user.id`).
   - Return the full job document (with `draft: true` to include draft versions).

3. **Create the edit page** at `src/app/(frontend)/dashboard/jobs/[id]/edit/page.tsx`:
   - This is a `'use client'` page wrapped in `AuthGuard`.
   - On mount, fetch the job from `GET /api/submissions/jobs?id={id}`.
   - Render the same form as `dashboard/jobs/new/page.tsx` but pre-populated with existing values.
   - On submit, call `PATCH /api/submissions/jobs` with the updated fields.
   - Redirect to `/dashboard?tab=jobs` on success.

4. **Update `MyJobs.tsx`**:
   - For jobs with `_status === 'draft'`, add an "Editar" button linking to `/dashboard/jobs/${job.id}/edit`.
   - Optionally also show the edit button for expired published jobs to allow re-submission.

5. **Allowed fields during editing** (draft jobs only):
   - `title`, `description`, `type`, `modality`, `city`, `compensation`, `tags`, `contactUrl`
   - `expiresAt` should NOT be user-editable (it auto-sets to 30 days from creation).
   - `entry` (company link) can be editable.

**Estimated complexity**: M

**Dependencies**: None

---

## Plan 7: Error Boundaries (#30)

**Problem**: No `error.tsx` files exist anywhere in the app. If a server component throws (e.g. database down, bad data), Next.js shows its default error page, which is unbranded and unhelpful to users.

**Files to modify**:
- `src/components/ui/ErrorFallback.tsx` (new — shared error UI component)
- `src/app/(frontend)/error.tsx` (new — top-level frontend error boundary)
- `src/app/(frontend)/[category]/[slug]/error.tsx` (new)
- `src/app/(frontend)/[category]/error.tsx` (new)
- `src/app/(frontend)/directorio/error.tsx` (new)
- `src/app/(frontend)/empleos/error.tsx` (new)
- `src/app/(frontend)/empleos/[slug]/error.tsx` (new)
- `src/app/(frontend)/noticias/error.tsx` (new)
- `src/app/(frontend)/noticias/[slug]/error.tsx` (new)
- `src/app/(frontend)/dashboard/error.tsx` (new)
- `src/app/(frontend)/eventos/error.tsx` (new)
- `src/app/global-error.tsx` (new — catches errors in root layout)

**Implementation steps**:

1. **Create a branded `ErrorFallback` component** at `src/components/ui/ErrorFallback.tsx`:
   - `'use client'` component (error boundaries must be client components).
   - Props: `error: Error & { digest?: string }`, `reset: () => void`, optional `title` and `message` overrides.
   - UI: centered layout with the site's styling (dark background, accent colors, mono font). Show a generic error icon, a title ("Algo salio mal"), a brief message, the error digest (if available, for support), and a "Reintentar" button that calls `reset()`. Include a "Volver al inicio" link as a fallback.
   - In development, show the error message. In production, show only the generic message.

2. **Create the top-level frontend error boundary** at `src/app/(frontend)/error.tsx`:
   - Import and render `ErrorFallback`. This catches any unhandled error in the `(frontend)` layout group.

3. **Create route-specific error boundaries** for key segments:
   - `[category]/[slug]/error.tsx` — "No pudimos cargar esta entrada." with link back to directorio.
   - `[category]/error.tsx` — "No pudimos cargar esta categoria." with link back to directorio.
   - `directorio/error.tsx` — "No pudimos cargar el directorio."
   - `empleos/error.tsx` and `empleos/[slug]/error.tsx` — "No pudimos cargar los empleos."
   - `noticias/error.tsx` and `noticias/[slug]/error.tsx` — "No pudimos cargar las noticias."
   - `dashboard/error.tsx` — "No pudimos cargar tu dashboard."
   - `eventos/error.tsx` — "No pudimos cargar los eventos."
   Each of these simply renders `<ErrorFallback>` with a contextual title and message.

4. **Create `src/app/global-error.tsx`**:
   - This catches errors thrown by the root layout itself (including font loading, theme provider, etc.).
   - Must include its own `<html>` and `<body>` tags since the root layout failed.
   - Render a minimal error page with inline styles (no Tailwind, since CSS may have failed to load).

5. **Not found pages**: Verify `not-found.tsx` files exist for key segments. This is related but separate from error boundaries. The existing `notFound()` calls in page components will already render Next.js's default 404 unless a custom `not-found.tsx` is provided.

**Estimated complexity**: S

**Dependencies**: None

---

## Plan 8: Rate Limiting (#16)

**Problem**: No rate limiting exists on any API route. All endpoints under `/api/` are unprotected against abuse, brute force, or accidental request storms.

**Files to modify**:
- `src/lib/rate-limit.ts` (new — rate limiting utility)
- `src/app/api/submissions/entries/route.ts`
- `src/app/api/submissions/jobs/route.ts`
- `src/app/api/entries/counts/route.ts`
- `src/app/api/entries/route.ts`
- `src/app/api/news/route.ts`
- `src/app/api/jobs/route.ts`
- `src/app/api/events/route.ts`
- `src/app/api/user/profile/route.ts`
- `src/app/api/user/entries/route.ts`
- `src/app/api/user/jobs/route.ts`
- `src/app/api/auth/[...all]/route.ts` (if applicable — better-auth may handle its own)
- `src/app/api/media/upload/route.ts` (if Plan 5 is implemented)

**Implementation steps**:

### Package recommendation
Use **`@upstash/ratelimit`** with an Upstash Redis instance. This is the most common approach for Next.js serverless deployments. If Redis is not desired, use an **in-memory** approach with a `Map<string, { count, timestamp }>` — simpler but won't work across multiple serverless instances.

**Alternative**: A lightweight custom implementation using the token bucket or sliding window algorithm with the existing PostgreSQL database (no new dependencies), but this adds write load to the DB.

### Rate limits per endpoint category

| Category | Endpoints | Limit | Window |
|---|---|---|---|
| Write (authenticated) | `POST /api/submissions/entries`, `POST /api/submissions/jobs`, `PATCH /api/submissions/*` | 10 requests | 15 minutes |
| Write (profile) | `PATCH /api/user/profile` | 20 requests | 15 minutes |
| Read (public) | `GET /api/entries`, `GET /api/entries/counts`, `GET /api/news`, `GET /api/jobs`, `GET /api/events` | 60 requests | 1 minute |
| Read (authenticated) | `GET /api/user/entries`, `GET /api/user/jobs` | 30 requests | 1 minute |
| File upload | `POST /api/media/upload` | 5 requests | 15 minutes |
| Auth | `POST /api/auth/*` | 10 requests | 15 minutes |

### Implementation approach
1. **Create `src/lib/rate-limit.ts`**:
   - Export a `rateLimit(identifier: string, limit: number, windowMs: number)` function.
   - If using Upstash: initialize `Ratelimit` from `@upstash/ratelimit` with a sliding window.
   - If in-memory: use a `Map` with a sliding window algorithm. Include a cleanup interval to prevent memory leaks.
   - Return `{ success: boolean, remaining: number, reset: number }`.

2. **Create a helper `withRateLimit(request: NextRequest, config: { limit, window, keyPrefix })`**:
   - Extract the client identifier: use `request.headers.get('x-forwarded-for')` or `request.ip` for public routes; use the session user ID for authenticated routes.
   - Call `rateLimit()` with `${keyPrefix}:${identifier}`.
   - If rate limited, return a `NextResponse.json({ error: 'Too many requests' }, { status: 429 })` with `Retry-After` header.
   - Otherwise return `null` (allow the request to proceed).

3. **Apply to each route**: At the top of each route handler, call `withRateLimit()`. If it returns a response, return it immediately.
   ```ts
   const limited = await withRateLimit(request, { limit: 10, window: '15m', keyPrefix: 'submit-entry' })
   if (limited) return limited
   ```

4. **Environment configuration**: Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env.example` (if using Upstash). Add a `RATE_LIMIT_DISABLED` env var for local development.

**Estimated complexity**: M

**Dependencies**: None (but should be done before Plan 5 goes to production)

---

## Plan 9: Missing TYPE_COPY for research-center (#25)

**Problem**: `src/components/forms/submit-wizard/types.ts` defines `TYPE_COPY` with entries for `startup`, `business`, `consultory`, `community`, and `person`, but is missing `research-center`. Since `ENTRY_TYPES` in `src/config.ts` includes `research-center`, the submit wizard will crash with a runtime error when a user selects "Centro de Investigacion" and reaches a step that reads from `TYPE_COPY`.

**Files to modify**:
- `src/components/forms/submit-wizard/types.ts`

**Implementation steps**:
1. Add the `research-center` entry to the `TYPE_COPY` record, after `consultory` and before `person`:
   ```ts
   'research-center': {
     entityName: 'centro de investigacion',
     namePlaceholder: 'Nombre del centro de investigacion',
     taglinePlaceholder: 'Una frase corta que describe el centro',
     descriptionPlaceholder: 'Describe el centro de investigacion, sus lineas de investigacion y actividades',
     successTitle: 'Centro de investigacion enviado',
     successMessage:
       'Tu centro de investigacion ha sido recibido. Lo revisaremos y lo agregaremos al directorio pronto.',
   },
   ```
2. Verify that the `StepBasicInfo` component (which uses `TYPE_COPY` for placeholders) renders correctly with the new entry type by testing the wizard flow end-to-end.

**Estimated complexity**: S

**Dependencies**: None

---

## Recommended Execution Order

1. **Plan 9** (S) — Quick fix, prevents runtime crash.
2. **Plan 7** (S) — Error boundaries protect users from unhandled errors now.
3. **Plan 3** (S) — Quick performance win on detail pages.
4. **Plan 4** (S) — Quick ISR win for jobs.
5. **Plan 2** (M) — Home page and counts optimization.
6. **Plan 1** (M) — Connection pool consolidation.
7. **Plan 8** (M) — Rate limiting (before opening write-heavy features).
8. **Plan 5** (M) — Image uploads (depends on rate limiting in production).
9. **Plan 6** (M) — Job editing (lower priority, additive feature).
