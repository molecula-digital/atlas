/**
 * Runtime helpers shared by Payload and Drizzle so the same code can run
 * on Node.js (local / Docker) and Cloudflare Workers.
 *
 * Workers cannot reuse TCP connections across requests, so the pool is
 * effectively disabled there (`maxUses: 1`). Pair that with Neon’s pooled
 * hostname or Cloudflare Hyperdrive.
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
      max: 1,
      min: 0,
      maxUses: 1,
      idleTimeoutMillis: 1,
      connectionTimeoutMillis: 5_000,
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
