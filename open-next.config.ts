import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache'
import memoryQueue from '@opennextjs/cloudflare/overrides/queue/memory-queue'

// Webpack, not Turbopack: Payload's production bundle duplicates packages
// under Turbopack and the Worker gzip blows the 10 MiB paid cap.
// OpenNext invokes this command (not package.json "build") so keep
// generate:importmap and --webpack together.
export default {
  ...defineCloudflareConfig({
    incrementalCache: withRegionalCache(r2IncrementalCache, {
      mode: 'long-lived',
    }),
    // Per-isolate ISR queue. Durable Object queues need wrangler deploy
    // (not versions upload), which is what PR preview Builds uses.
    queue: memoryQueue,
    // Serve ISR/SSG from the incremental cache without loading Next/Payload.
    enableCacheInterception: true,
  }),
  buildCommand: 'pnpm generate:importmap && pnpm exec next build --webpack',
}
