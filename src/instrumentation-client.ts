// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'
import posthog from 'posthog-js'

Sentry.init({
  dsn: 'https://98263700eab0f985743b6e16c277d391@o4507567704506368.ingest.us.sentry.io/4511154327322624',

  // Only report from real deployments — in dev the ingest proxy just times out.
  enabled: process.env.NODE_ENV === 'production',

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Sample 10% of traces in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,
  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Define how likely Replay events are sampled.
  // This sets the sample rate to be 10%. You may want this to be 100% while
  // in development and sample at a lower rate in production
  replaysSessionSampleRate: 0.1,

  // Define how likely Replay events are sampled when an error occurs.
  replaysOnErrorSampleRate: 1.0,

  // Enable sending user PII (Personally Identifiable Information)
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/options/#sendDefaultPii
  sendDefaultPii: true,
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart

// PostHog product analytics. Next.js loads this file (not a root-level
// instrumentation-client.ts) because the app lives under src/ — putting the
// init anywhere else means it silently never runs and every capture is a no-op.
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

// Production only, matching Sentry above. Without this every `pnpm dev` session
// writes into the same project the real numbers live in: the events are
// indistinguishable from real ones after the fact, and the persons they invent
// stay in the list for good.
const analyticsEnabled = process.env.NODE_ENV === 'production'

// Browser-only. Next.js also evaluates this module in the prerender workers,
// and there is nothing to capture outside a browser anyway.
if (typeof window === 'undefined') {
  // no-op during SSR and static generation
} else if (!analyticsEnabled) {
  // no-op outside production
} else if (!posthogToken) {
  console.warn(
    'PostHog is not configured: NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is missing, so events are silently dropped.',
  )
} else {
  posthog.init(posthogToken, {
    // Falling back to PostHog directly rather than refusing to start: losing
    // the proxy costs us the visitors running blockers, but a deploy that
    // forgets the host would otherwise capture nothing at all, and the only
    // sign of it is a console warning nobody reads.
    api_host: posthogHost || 'https://us.i.posthog.com',
    // With a reverse proxy, `api_host` is our own domain — PostHog would
    // otherwise build toolbar and "view in PostHog" links against it and they
    // would 404. `ui_host` keeps those pointing at the real app.
    ui_host:
      process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || 'https://us.posthog.com',
    // Without this, `capture_pageview` resolves to the legacy `true`, which only
    // fires on a full document load. Almost every navigation here is an App
    // Router history push, so pageviews would be missed. `defaults` opts into
    // `capture_pageview: 'history_change'`.
    defaults: '2026-05-30',
    capture_exceptions: true,
  })
}
