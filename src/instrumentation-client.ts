// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

// ─────────────────────────────────────────────────────────────────────────────
// SENTRY — Error monitoring, performance, and privacy-safe session replay
// ─────────────────────────────────────────────────────────────────────────────
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

  // Do not attach IP addresses, cookies, request headers, or user identity to
  // error reports. Product analytics has its own deliberately limited ID.
  sendDefaultPii: false,
  beforeSend(event) {
    event.user = undefined
    if (event.request) {
      event.request = {
        method: event.request.method,
        url: event.request.url?.split('?')[0],
      }
    }
    return event
  },
})

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
