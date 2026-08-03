import { Pool } from 'pg'

/**
 * Shared PostgreSQL connection pool for auth and Drizzle.
 * Payload CMS maintains its own pool via postgresAdapter (separate schema).
 */
const pool = new Pool({
  connectionString: process.env.DATABASE_URI,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
})

export { pool }
