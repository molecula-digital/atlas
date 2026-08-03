// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: 'https://98263700eab0f985743b6e16c277d391@o4507567704506368.ingest.us.sentry.io/4511154327322624',

  // Only report from real deployments — in dev the ingest proxy just times out.
  enabled: process.env.NODE_ENV === 'production',

  // Sample 10% of traces in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1,

  // Enable logs to be sent to Sentry
  enableLogs: true,

  // Requests can contain auth cookies and form data, none of which belongs in
  // error monitoring. Keep only the method and path, without query values.
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
