import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import pg from 'pg'

if (!process.env.DATABASE_DIRECT_URL) {
  console.error('DATABASE_DIRECT_URL is not set')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_DIRECT_URL,
  max: 1,
  connectionTimeoutMillis: 10_000,
})

try {
  const db = drizzle(pool)
  console.log('Running Drizzle migrations...')
  await migrate(db, { migrationsFolder: './drizzle' })
  console.log('Drizzle migrations complete')
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
} finally {
  await pool.end()
}
