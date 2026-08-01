// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";
import posthog from "posthog-js";

Sentry.init({
  dsn: "https://98263700eab0f985743b6e16c277d391@o4507567704506368.ingest.us.sentry.io/4511154327322624",

  // Only report from real deployments — in dev the ingest proxy just times out.
  enabled: process.env.NODE_ENV === "production",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  // Sample 10% of traces in production, 100% in development
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1,
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
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// PostHog product analytics. Next.js loads this file (not a root-level
// instrumentation-client.ts) because the app lives under src/ — putting the
// init anywhere else means it silently never runs and every capture is a no-op.
const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

// Browser-only. Next.js also evaluates this module in the prerender workers,
// and `tracing_headers` below patches the global fetch/XHR — doing that inside
// a build worker breaks Payload's cached queries and fails the build with
// Postgres ETIMEDOUT. There is nothing to capture outside a browser anyway.
if (typeof window === "undefined") {
  // no-op during SSR and static generation
} else if (!posthogToken || !posthogHost) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(
      `PostHog is not configured: ${
        !posthogToken
          ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN"
          : "NEXT_PUBLIC_POSTHOG_HOST"
      } is missing, so events are silently dropped.`,
    );
  }
} else {
  posthog.init(posthogToken, {
    api_host: posthogHost,
    // With a reverse proxy, `api_host` is our own domain — PostHog would
    // otherwise build toolbar and "view in PostHog" links against it and they
    // would 404. `ui_host` keeps those pointing at the real app.
    ui_host: process.env.NEXT_PUBLIC_POSTHOG_UI_HOST || "https://us.posthog.com",
    // Without this, `capture_pageview` resolves to the legacy `true`, which only
    // fires on a full document load. Almost every navigation here is an App
    // Router history push, so pageviews would be missed. `defaults` opts into
    // `capture_pageview: 'history_change'`.
    defaults: "2026-05-30",
    capture_exceptions: true,
    // Lets route handlers attribute their events to the same person as the
    // browser session. Hostname only — ports and protocols never match.
    tracing_headers: apiHostnames(),
  });
}

/**
 * Hostnames our own `fetch` calls go to, so PostHog attaches its distinct-id
 * and session-id headers to them. Requests use relative URLs, so this is just
 * wherever the app is served from.
 */
function apiHostnames(): string[] {
  const hostnames = new Set<string>();

  if (typeof window !== "undefined") {
    hostnames.add(window.location.hostname);
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (siteUrl) {
    try {
      hostnames.add(new URL(siteUrl).hostname);
    } catch {
      // A malformed NEXT_PUBLIC_SITE_URL should not stop analytics from loading.
    }
  }

  return [...hostnames];
}
