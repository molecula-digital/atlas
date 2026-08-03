import { defineConfig } from 'drizzle-kit'

if (!process.env.DATABASE_DIRECT_URL) {
  throw new Error('DATABASE_DIRECT_URL is required for Drizzle commands')
}

export default defineConfig({
  schema: './src/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_DIRECT_URL,
  },
})
