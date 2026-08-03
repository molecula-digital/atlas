FROM node:20-alpine AS base
RUN corepack enable

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG DATABASE_URI
ARG DATABASE_DIRECT_URL
ARG SENTRY_AUTH_TOKEN
ENV DATABASE_URI=${DATABASE_URI}
ENV DATABASE_DIRECT_URL=${DATABASE_DIRECT_URL}
ENV SENTRY_AUTH_TOKEN=${SENTRY_AUTH_TOKEN}
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Analytics only. NEXT_PUBLIC_* is inlined into the bundle by `next build`
# below, not read at runtime — passing these at `docker run` is too late. A
# missing one does not fail the build; it ships as undefined and the feature
# silently does nothing, which is how analytics can look wired up and capture
# zero.
#
# Every ARG here has a default, and that is load-bearing rather than tidiness.
# `ARG FOO` with no default followed by `ENV FOO=${FOO}` does not leave FOO
# unset — it sets it to the empty string, and an empty-but-present key still
# counts as "defined at build time" to Next, so it gets inlined as empty and
# `docker run --env-file` can never supply it afterwards. Defaults mean an
# omitted --build-arg reproduces the previous behaviour instead of blanking it.
#
# NEXT_PUBLIC_SITE_URL is deliberately NOT listed. It has no ARG, so it stays
# absent at build time and therefore stays a real runtime lookup in the server
# bundle — which is how --env-file supplies it today. Adding it here would
# freeze it at build and break every non-production deployment.
ARG NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=
ARG NEXT_PUBLIC_POSTHOG_HOST=https://t.molecula.digital
ARG NEXT_PUBLIC_POSTHOG_UI_HOST=https://us.posthog.com
ARG NEXT_PUBLIC_UMAMI_WEBSITE_ID=87276dcc-091a-468d-a36f-4f1be4c4e1bc
ARG NEXT_PUBLIC_UMAMI_SRC=https://analytics.molecula.digital/script.js
ENV NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN=${NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN}
ENV NEXT_PUBLIC_POSTHOG_HOST=${NEXT_PUBLIC_POSTHOG_HOST}
ENV NEXT_PUBLIC_POSTHOG_UI_HOST=${NEXT_PUBLIC_POSTHOG_UI_HOST}
ENV NEXT_PUBLIC_UMAMI_WEBSITE_ID=${NEXT_PUBLIC_UMAMI_WEBSITE_ID}
ENV NEXT_PUBLIC_UMAMI_SRC=${NEXT_PUBLIC_UMAMI_SRC}

RUN pnpm generate:importmap
RUN pnpm payload:migrate -- --force-accept-warning
RUN node scripts/migrate.mjs
RUN pnpm build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/sentry.server.config.ts ./
COPY --from=builder --chown=nextjs:nodejs /app/sentry.edge.config.ts ./

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://localhost:3000/api/health').then(r => { if (!r.ok) throw r.status }).catch(() => process.exit(1))"

CMD ["node", "server.js"]
