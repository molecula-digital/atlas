import { defineCloudflareConfig } from '@opennextjs/cloudflare'
import r2IncrementalCache from '@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache'
import { withRegionalCache } from '@opennextjs/cloudflare/overrides/incremental-cache/regional-cache'
import doQueue from '@opennextjs/cloudflare/overrides/queue/do-queue'
import doShardedTagCache from '@opennextjs/cloudflare/overrides/tag-cache/do-sharded-tag-cache'

// Webpack, not Turbopack: Payload's production bundle duplicates packages
// under Turbopack and the Worker gzip blows the 10 MiB paid cap.
// OpenNext invokes this command (not package.json "build") so keep
// generate:importmap and --webpack together.
export default {
  ...defineCloudflareConfig({
    incrementalCache: withRegionalCache(r2IncrementalCache, {
      mode: 'long-lived',
    }),
    queue: doQueue,
    tagCache: doShardedTagCache({ baseShardSize: 4 }),
    // Serve ISR/SSG from the incremental cache without loading Next/Payload.
    enableCacheInterception: true,
  }),
  buildCommand: 'pnpm generate:importmap && pnpm exec next build --webpack',
}
