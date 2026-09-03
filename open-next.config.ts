import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Webpack, not Turbopack: Payload's production bundle duplicates packages
// under Turbopack and the Worker gzip blows the 10 MiB paid cap.
const config = defineCloudflareConfig({})
config.buildCommand =
  'pnpm generate:importmap && pnpm exec next build --webpack'

export default config
