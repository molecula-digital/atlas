/** Day key in UTC so every visitor shares the same relevance order for a day. */
export function utcDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

/** FNV-1a 32-bit — fast, deterministic, good enough for sort jitter. */
export function stableHash(input: string): number {
  let hash = 2166136261
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

/**
 * Type weights for relevance: startups float up, other orgs next, then
 * communities and people. Jitter (below) still lets a strong non-startup
 * interleave so the grid is not a solid block of one type.
 */
const TYPE_BOOST: Record<string, number> = {
  startup: 40_000,
  business: 25_000,
  consultory: 25_000,
  'research-center': 25_000,
  community: 15_000,
  person: 10_000,
}

export type RelevanceDoc = {
  id: string | number
  featured?: boolean | null
  entryType?: string | null
  name?: string | null
  publishDate?: string | null
}

/**
 * Relevance score for directory ranking.
 *
 * - Featured entries get a large fixed boost (editorial curation).
 * - Startups (then other orgs) get a type boost so the default view
 *   is not a pure chronological dump.
 * - A day-stable hash jitter keeps the order dynamic across days without
 *   breaking pagination within a day.
 * - Callers should tie-break with publishDate (desc) then id.
 */
export function relevanceScore(
  doc: RelevanceDoc,
  dayKey: string = utcDayKey(),
): number {
  const featuredBoost = doc.featured ? 100_000 : 0
  const typeBoost = TYPE_BOOST[doc.entryType ?? ''] ?? 5_000
  const jitter = stableHash(`${String(doc.id)}:${dayKey}`) % 10_000
  return featuredBoost + typeBoost + jitter
}

export function compareByRelevance(
  a: RelevanceDoc,
  b: RelevanceDoc,
  dayKey: string = utcDayKey(),
): number {
  const scoreDiff = relevanceScore(b, dayKey) - relevanceScore(a, dayKey)
  if (scoreDiff !== 0) return scoreDiff

  const aDate = a.publishDate ? Date.parse(String(a.publishDate)) || 0 : 0
  const bDate = b.publishDate ? Date.parse(String(b.publishDate)) || 0 : 0
  if (bDate !== aDate) return bDate - aDate

  return String(a.id).localeCompare(String(b.id))
}
