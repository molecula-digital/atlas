/**
 * `generateStaticParams` talks to Payload/Postgres. Cloudflare / OpenNext
 * builds should still succeed when the database is unreachable — those
 * routes then render on demand (`dynamicParams` defaults to true).
 */
export async function safeStaticParams<T>(
  load: () => Promise<T[]>,
): Promise<T[]> {
  try {
    return await load()
  } catch (error) {
    console.warn('generateStaticParams: skipping prerender', error)
    return []
  }
}
