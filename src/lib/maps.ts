/**
 * Turns the Google Maps link an editor pastes on an event into an embeddable
 * map URL.
 *
 * The embed deliberately never queries the event's `location` text. That field
 * is free-form ("PEIS 4to piso") and carries no city or state, so Google treats
 * it as a *category* search rather than a place lookup and answers with a
 * scatter of unrelated venues — restaurants, museums, yoga studios. The pasted
 * `mapsUrl` is the only field that identifies the venue unambiguously, so the
 * embed is derived from its coordinates and nothing else.
 */

/** WGS84 coordinate pair pulled out of a Google Maps URL. */
export interface LatLng {
  lat: number
  lng: number
}

/** Hosts that serve shortened links needing a redirect to reveal the place. */
const SHORT_LINK_HOSTS = new Set(['maps.app.goo.gl', 'goo.gl'])

/** Building-level view — close enough to read the block, wide enough to orient. */
const EMBED_ZOOM = 17

/** Short links are immutable, so a resolved redirect can be cached for a day. */
const RESOLVE_REVALIDATE_SECONDS = 86_400

/** Keeps a slow redirect from stalling a static build. */
const RESOLVE_TIMEOUT_MS = 5_000

function toLatLng(lat: string, lng: string): LatLng | null {
  const parsed = { lat: Number(lat), lng: Number(lng) }
  if (!Number.isFinite(parsed.lat) || !Number.isFinite(parsed.lng)) return null
  if (Math.abs(parsed.lat) > 90 || Math.abs(parsed.lng) > 180) return null
  // 0,0 is Null Island — in practice a parse artefact, not a Sinaloa venue.
  if (parsed.lat === 0 && parsed.lng === 0) return null
  return parsed
}

/** Query params Google uses to carry an explicit coordinate pair. */
const COORD_PARAMS = ['q', 'query', 'll', 'center', 'daddr']

/**
 * Extracts the venue's coordinates from a resolved Google Maps URL.
 *
 * Precedence matters: `!3d…!4d…` inside the `data=` blob is the pin Google
 * itself dropped on the place, whereas `@lat,lng` is only the camera position
 * of whoever copied the link and can sit a block or more off the venue.
 */
export function extractLatLng(mapsUrl: string): LatLng | null {
  let url: URL
  try {
    url = new URL(mapsUrl)
  } catch {
    return null
  }

  // The place's own pin, tagged `!8m2` in the data blob.
  const placePin = url.href.match(/!8m2!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  if (placePin) {
    const coords = toLatLng(placePin[1], placePin[2])
    if (coords) return coords
  }

  // Explicit coordinates, e.g. `?q=24.79,-107.42` or the Maps URL API's `query`.
  for (const key of COORD_PARAMS) {
    const value = url.searchParams.get(key)
    const pair = value?.match(/^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/)
    if (pair) {
      const coords = toLatLng(pair[1], pair[2])
      if (coords) return coords
    }
  }

  // Any other pin in the data blob, before falling back to the camera.
  const anyPin = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/)
  if (anyPin) {
    const coords = toLatLng(anyPin[1], anyPin[2])
    if (coords) return coords
  }

  // Camera position — last resort, roughly right rather than exact.
  const camera = url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/)
  if (camera) {
    const coords = toLatLng(camera[1], camera[2])
    if (coords) return coords
  }

  return null
}

export function isShortMapsLink(mapsUrl: string): boolean {
  try {
    return SHORT_LINK_HOSTS.has(new URL(mapsUrl).hostname)
  } catch {
    return false
  }
}

/** Follows a `maps.app.goo.gl` redirect to the full place URL. */
async function resolveShortLink(mapsUrl: string): Promise<string | null> {
  try {
    const res = await fetch(mapsUrl, {
      redirect: 'follow',
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
      next: { revalidate: RESOLVE_REVALIDATE_SECONDS },
    })
    // `res.url` is the final URL after redirects; a non-OK status still
    // resolves it, which is all we need.
    return res.url || null
  } catch {
    return null
  }
}

/**
 * Coordinate-anchored embed URL. A `lat,lng` query pins the map to exactly one
 * point, which is what keeps Google out of category-search mode.
 */
export function buildMapEmbedUrl({ lat, lng }: LatLng): string {
  const params = new URLSearchParams({
    q: `${lat},${lng}`,
    z: String(EMBED_ZOOM),
    hl: 'es',
    output: 'embed',
  })
  return `https://www.google.com/maps?${params}`
}

/**
 * Resolves an event's `mapsUrl` into an embeddable map URL.
 *
 * Returns null when the link yields no usable coordinates. Callers should drop
 * the map entirely in that case — showing a guessed location is the bug this
 * module exists to prevent.
 */
export async function resolveMapEmbedUrl(mapsUrl: string): Promise<string | null> {
  if (!mapsUrl) return null

  const direct = extractLatLng(mapsUrl)
  if (direct) return buildMapEmbedUrl(direct)

  if (!isShortMapsLink(mapsUrl)) return null

  const resolved = await resolveShortLink(mapsUrl)
  if (!resolved) return null

  const coords = extractLatLng(resolved)
  return coords ? buildMapEmbedUrl(coords) : null
}
