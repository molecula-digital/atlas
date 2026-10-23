/**
 * OpenNext only generates a fetch handler. Luma sync needs a scheduled
 * handler, so this file is the Worker entry and delegates requests to
 * `.open-next/worker.js` (produced by `opennextjs-cloudflare build`).
 *
 * The cron calls the Next route in-process. That writes the same Neon
 * database the site reads, and it does not depend on the public hostname
 * or on the GitHub Actions secret.
 */
import { default as handler } from './.open-next/worker.js'

const LUMA_SYNC_URL = 'https://atlas-sinaloa.tech/api/cron/luma-sync'

const worker = {
  fetch: handler.fetch,

  async scheduled(_controller, env, ctx) {
    const secret =
      typeof env.CRON_SECRET === 'string' ? env.CRON_SECRET.trim() : ''
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

    const response = await handler.fetch(
      new Request(LUMA_SYNC_URL, {
        method: 'POST',
        headers: { authorization: `Bearer ${secret}` },
      }),
      env,
      ctx,
    )
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
  },
}

export default worker
