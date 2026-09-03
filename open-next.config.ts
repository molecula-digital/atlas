import { defineCloudflareConfig } from '@opennextjs/cloudflare'

// Webpack, not Turbopack: Payload's production bundle duplicates packages
// under Turbopack and the Worker gzip blows the 10 MiB paid cap.
// OpenNext runs this command (not package.json "build") — keep generate and
// --webpack together so a clean Cloudflare clone always has importMap.js.
export default {
  ...defineCloudflareConfig({}),
  buildCommand:
    'pnpm generate:importmap && pnpm exec next build --webpack',
}
