import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Webpack, not Turbopack: Payload's production bundle duplicates packages
// under Turbopack and the Worker gzip blows the 10 MiB paid cap.
// OpenNext invokes this command (not package.json "build") so keep
// generate:importmap and --webpack together.
export default {
  ...defineCloudflareConfig({}),
  buildCommand: 'pnpm generate:importmap && pnpm exec next build --webpack',
}
