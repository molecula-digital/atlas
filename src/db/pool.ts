import { Pool } from 'pg'
import { getDatabaseUrl, postgresPoolOptions } from '@/lib/runtime'

/**
 * Shared PostgreSQL connection pool for auth and Drizzle.
 * Payload CMS maintains its own pool via postgresAdapter (separate schema).
 *
 * Created lazily so Cloudflare Workers can populate `process.env` (and the
 * Hyperdrive binding) before the first query. Drizzle holds this proxy and
 * calls `.query()` later.
 */
let instance: Pool | undefined

export function getPool(): Pool {
  if (!instance) {
    instance = new Pool(postgresPoolOptions(getDatabaseUrl()))
  }
  return instance
}

export const pool: Pool = new Proxy({} as Pool, {
  get(_target, prop, receiver) {
    const target = getPool()
    const value = Reflect.get(target, prop, receiver)
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(target)
      : value
  },
})
