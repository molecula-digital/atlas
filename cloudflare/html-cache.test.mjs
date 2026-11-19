import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  BROWSER_MAX_AGE,
  EDGE_MAX_AGE,
  EDGE_SWR,
  HTML_CACHE_TAG,
  shouldPurgeHtmlCache,
  withPublicHtmlCache,
} from './html-cache.mjs'

function htmlResponse(headers, { status = 200, body = '<html></html>' } = {}) {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/html; charset=utf-8', ...headers },
  })
}

test('rewrites public HTML onto max-age + CDN SWR and drops color-scheme hints', async () => {
  const rewritten = withPublicHtmlCache(
    htmlResponse({
      'cache-control': 's-maxage=31536000, stale-while-revalidate=2592000',
      vary: 'Sec-CH-Prefers-Color-Scheme, Accept-Encoding',
      'accept-ch': 'Sec-CH-Prefers-Color-Scheme',
      'critical-ch': 'Sec-CH-Prefers-Color-Scheme',
    }),
  )

  assert.equal(rewritten.headers.get('Accept-CH'), null)
  assert.equal(rewritten.headers.get('Critical-CH'), null)
  assert.equal(rewritten.headers.get('Vary'), 'Accept-Encoding')
  assert.equal(
    rewritten.headers.get('Cache-Control'),
    `public, max-age=${BROWSER_MAX_AGE}, stale-while-revalidate=${EDGE_SWR}`,
  )
  assert.equal(
    rewritten.headers.get('Cloudflare-CDN-Cache-Control'),
    `public, max-age=${EDGE_MAX_AGE}, stale-while-revalidate=${EDGE_SWR}, stale-if-error=${EDGE_SWR}`,
  )
  assert.equal(rewritten.headers.get('Cache-Tag'), HTML_CACHE_TAG)
  assert.equal(await rewritten.text(), '<html></html>')
})

test('leaves no-store HTML (admin / auth) untouched', () => {
  const original = htmlResponse({ 'cache-control': 'private, no-store' })
  const rewritten = withPublicHtmlCache(original)
  assert.equal(rewritten, original)
})

test('leaves JSON and non-200 responses untouched', () => {
  const json = new Response('{}', {
    headers: { 'content-type': 'application/json', 'cache-control': 'public' },
  })
  assert.equal(withPublicHtmlCache(json), json)

  const missing = htmlResponse({ 'cache-control': 'public' }, { status: 404 })
  assert.equal(withPublicHtmlCache(missing), missing)
})

test('purges HTML cache on CMS and cron writes, not on auth or GET', () => {
  assert.equal(shouldPurgeHtmlCache('POST', '/api/entries'), true)
  assert.equal(shouldPurgeHtmlCache('PATCH', '/api/events/1'), true)
  assert.equal(shouldPurgeHtmlCache('POST', '/api/cron/luma-sync'), true)
  assert.equal(shouldPurgeHtmlCache('POST', '/api/auth/sign-in'), false)
  assert.equal(shouldPurgeHtmlCache('GET', '/api/entries'), false)
  assert.equal(shouldPurgeHtmlCache('GET', '/'), false)
})
