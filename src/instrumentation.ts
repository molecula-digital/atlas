export async function register() {
  // Cloudflare Workers cannot load Sentry's Node auto-instrumentation
  // (`require-in-the-middle`). Browser errors still go through
  // `instrumentation-client.ts`.
  if (process.env.CLOUDFLARE_BUILD === '1') return

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config')
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config')
  }
}

export async function onRequestError(
  ...args: Parameters<typeof import('@sentry/nextjs').captureRequestError>
) {
  if (process.env.CLOUDFLARE_BUILD === '1') return
  const Sentry = await import('@sentry/nextjs')
  return Sentry.captureRequestError(...args)
}
