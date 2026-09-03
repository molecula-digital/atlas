import { isCloudflareBuildEnv } from './cloudflare-build-env'

/**
 * `generateStaticParams` talks to Payload/Postgres. Swallow connection
 * errors in local `next dev` so a down database does not crash the app.
 * Production / Cloudflare builds must fail instead of shipping empty routes.
 */
export async function safeStaticParams<T>(
  load: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await load()
  } catch (error) {
    const failBuild = process.env.CI === 'true' || isCloudflareBuildEnv()
    if (failBuild) throw error
    console.warn('generateStaticParams: skipping prerender', error)
    return []
  }
}
