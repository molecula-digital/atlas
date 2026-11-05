/**
 * Runtime helpers shared by Payload and Drizzle so the same code can run
 * on Node.js (local / Docker) and Cloudflare Workers.
 *
 * Workers should not keep a query connection for a later request, so
 * `maxUses` is 1. Payload still checks out one client inside
 * `connectWithReconnect` and never releases it, so `max` has to leave a
 * free slot for the query that runs after that. Pair this with Neon’s
 * pooled hostname or Cloudflare Hyperdrive.
 */

import { getCloudflareContext } from '@opennextjs/cloudflare'

export function isCloudflareWorkers(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    navigator.userAgent === 'Cloudflare-Workers'
  )
}

export function getDatabaseUrl(): string {
  try {
    const connectionString =
      getCloudflareContext().env.HYPERDRIVE?.connectionString
    if (connectionString) return connectionString
  } catch {
    // Node.js, `next build`, Payload CLI — no Workers context.
  }

  return process.env.DATABASE_URL || ''
}

export function postgresPoolOptions(connectionString = getDatabaseUrl()) {
  if (isCloudflareWorkers()) {
    return {
      connectionString,
      // Payload's adapter holds one client for the life of the isolate.
      // max: 1 makes the next checkout wait until connectionTimeoutMillis
      // and every page query fails with "timeout exceeded when trying to connect".
      // A transaction keeps a second client, so leave room past those two.
      max: 4,
      min: 0,
      maxUses: 1,
      idleTimeoutMillis: 5_000,
      // Neon can take longer than 5s to wake a suspended compute.
      connectionTimeoutMillis: 20_000,
    }
  }

  return {
    connectionString,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
  }
}

/**
 * Payload calls `new Pool(poolOptions)` on connect, not at config load.
 * A proxy keeps Hyperdrive / Worker secrets from being frozen as `''`.
 */
export function lazyPostgresPoolOptions() {
  return new Proxy({} as ReturnType<typeof postgresPoolOptions>, {
    get(_target, prop, receiver) {
      return Reflect.get(postgresPoolOptions(getDatabaseUrl()), prop, receiver)
    },
    ownKeys() {
      return Reflect.ownKeys(postgresPoolOptions(getDatabaseUrl()))
    },
    getOwnPropertyDescriptor(_target, prop) {
      return Object.getOwnPropertyDescriptor(
        postgresPoolOptions(getDatabaseUrl()),
        prop,
      )
    },
  })
}
