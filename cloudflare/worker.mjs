/**
 * OpenNext only generates a fetch handler. Luma sync and keep-alive need a
 * scheduled handler, so this file is the Worker entry and delegates requests
 * to `.open-next/worker.js` (produced by `opennextjs-cloudflare build`).
 *
 * The cron calls the Next route in-process. That writes the same Neon
 * database the site reads, and it does not depend on the public hostname
 * or on a public hostname.
 */
import { connect as cloudflareConnect } from 'cloudflare:sockets'
import { default as handler } from '../.open-next/worker.js'

// Durable Object classes from OpenNext. Wrangler bindings point at this
// entry, so they have to be re-exported here or ISR revalidation is a no-op.
export { DOQueueHandler, DOShardedTagCache } from '../.open-next/worker.js'

// pg-cloudflare reads this when it opens a TCP socket. A dynamic
// import("cloudflare:sockets") goes through the Node compatibility loader
// and fails in the Worker.
globalThis.__cloudflareConnect = cloudflareConnect

const SITE_ORIGIN = 'https://atlas-sinaloa.tech'
const LUMA_SYNC_URL = `${SITE_ORIGIN}/api/cron/luma-sync`
const KEEP_ALIVE_URL = `${SITE_ORIGIN}/api/cron/keep-alive`
const KEEP_ALIVE_CRON = '*/3 * * * *'
const WARM_PATHS = ['/', '/directorio', '/eventos']

/** Cap HTML at the Workers Cache so CMS edits are not stuck behind a 1-year s-maxage. */
const MAX_HTML_S_MAXAGE = 300

function cronSecret(env) {
  return typeof env.CRON_SECRET === 'string' ? env.CRON_SECRET.trim() : ''
}

function withCappedHtmlCache(response) {
  if (response.status !== 200) return response
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.includes('text/html')) return response

  const cacheControl = response.headers.get('cache-control') || ''
  if (/no-store|private/.test(cacheControl)) return response

  const match = cacheControl.match(/s-maxage=(\d+)/)
  if (!match) return response

  const current = Number(match[1])
  if (!Number.isFinite(current) || current <= MAX_HTML_S_MAXAGE) {
    return response
  }

  let next = cacheControl.replace(
    /s-maxage=\d+/,
    `s-maxage=${MAX_HTML_S_MAXAGE}`,
  )
  if (!/\bpublic\b/i.test(next)) next = `public, ${next}`

  const headers = new Headers(response.headers)
  headers.set('Cache-Control', next)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function fetchInternal(url, env, ctx, init = {}) {
  return handler.fetch(new Request(url, init), env, ctx)
}

async function runKeepAlive(env, ctx) {
  const secret = cronSecret(env)
  if (!secret) {
    console.error(
      JSON.stringify({
        event: 'keep-alive',
        ok: false,
        error: 'CRON_SECRET is not set on the Worker',
      }),
    )
    throw new Error('CRON_SECRET is not set on the Worker')
  }

  const ping = await fetchInternal(KEEP_ALIVE_URL, env, ctx, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  })
  const pingBody = await ping.text()
  console.log(
    JSON.stringify({
      event: 'keep-alive',
      status: ping.status,
      body: pingBody.slice(0, 300),
    }),
  )
  if (!ping.ok) {
    throw new Error(`keep-alive failed with HTTP ${ping.status}`)
  }

  for (const path of WARM_PATHS) {
    const response = await fetchInternal(`${SITE_ORIGIN}${path}`, env, ctx)
    console.log(
      JSON.stringify({
        event: 'keep-alive-warm',
        path,
        status: response.status,
      }),
    )
    // Drain so the isolate can reuse the connection; body is unused.
    await response.text()
  }
}

async function runLumaSync(env, ctx) {
  const secret = cronSecret(env)
  if (!secret) {
    console.error(
      JSON.stringify({
        event: 'luma-sync',
        ok: false,
        error: 'CRON_SECRET is not set on the Worker',
      }),
    )
    throw new Error('CRON_SECRET is not set on the Worker')
  }

  const response = await fetchInternal(LUMA_SYNC_URL, env, ctx, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}` },
  })
  const body = await response.text()
  console.log(
    JSON.stringify({
      event: 'luma-sync',
      status: response.status,
      body: body.slice(0, 500),
    }),
  )
  if (!response.ok) {
    throw new Error(`luma-sync failed with HTTP ${response.status}`)
  }
}

const worker = {
  async fetch(request, env, ctx) {
    const response = await handler.fetch(request, env, ctx)
    return withCappedHtmlCache(response)
  },

  async scheduled(controller, env, ctx) {
    if (controller.cron === KEEP_ALIVE_CRON) {
      await runKeepAlive(env, ctx)
      return
    }

    await runLumaSync(env, ctx)
  },
}

export default worker
