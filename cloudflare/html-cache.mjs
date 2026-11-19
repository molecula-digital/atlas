/**
 * Public HTML is cacheable. Next ISR still emits `s-maxage`, which Cloudflare
 * treats as proxy-revalidate and that **disables stale-while-revalidate**.
 * After the short TTL every visitor waited on a cold isolate.
 *
 * Theme is applied in the client (`next-themes`). The HTML body does not
 * change with `Sec-CH-Prefers-Color-Scheme`, but Next still sends
 * `Critical-CH` / `Vary` for it. Chromium then retries the navigation with
 * a different cache key — a MISS on the "second" request.
 */

export const HTML_CACHE_TAG = 'html'

/** Edge TTL. SWR covers a day of background refresh after that. */
export const EDGE_MAX_AGE = 3600
export const EDGE_SWR = 86400

/** Browsers keep HTML briefly so a publish is visible without a hard refresh. */
export const BROWSER_MAX_AGE = 60

const COLOR_SCHEME_CH = 'sec-ch-prefers-color-scheme'

const MUTATING = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

/**
 * @param {string} header
 * @returns {string[]}
 */
function splitHeaderList(header) {
  return header
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
}

/**
 * @param {Headers} headers
 */
function stripColorSchemeClientHints(headers) {
  headers.delete('Accept-CH')
  headers.delete('Critical-CH')

  const vary = headers.get('Vary')
  if (!vary) return

  const kept = splitHeaderList(vary).filter(
    (token) => token.toLowerCase() !== COLOR_SCHEME_CH,
  )
  if (kept.length > 0) headers.set('Vary', kept.join(', '))
  else headers.delete('Vary')
}

/**
 * Rewrite a public HTML response so Workers Cache can HIT across browsers
 * and serve stale instead of blocking on the isolate.
 *
 * @param {Response} response
 * @returns {Response}
 */
export function withPublicHtmlCache(response) {
  if (response.status !== 200) return response

  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const cacheControl = response.headers.get('cache-control') || ''
  if (/no-store|private/.test(cacheControl)) return response

  const headers = new Headers(response.headers)
  stripColorSchemeClientHints(headers)

  // `s-maxage` implies proxy-revalidate on Cloudflare and cancels SWR.
  headers.set(
    'Cache-Control',
    `public, max-age=${BROWSER_MAX_AGE}, stale-while-revalidate=${EDGE_SWR}`,
  )
  headers.set(
    'Cloudflare-CDN-Cache-Control',
    `public, max-age=${EDGE_MAX_AGE}, stale-while-revalidate=${EDGE_SWR}, stale-if-error=${EDGE_SWR}`,
  )

  const tags = splitHeaderList(headers.get('Cache-Tag') || '')
  if (!tags.some((tag) => tag.toLowerCase() === HTML_CACHE_TAG)) {
    headers.append('Cache-Tag', HTML_CACHE_TAG)
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * CMS writes go through Payload REST. Luma sync is also a POST under /api.
 * Auth POSTs must not flush the public HTML cache.
 *
 * @param {string} method
 * @param {string} pathname
 * @returns {boolean}
 */
export function shouldPurgeHtmlCache(method, pathname) {
  if (!MUTATING.has(method.toUpperCase())) return false
  if (!pathname.startsWith('/api/')) return false
  if (pathname === '/api/auth' || pathname.startsWith('/api/auth/')) {
    return false
  }
  return true
}
