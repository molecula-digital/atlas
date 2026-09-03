#!/usr/bin/env node
/**
 * `pnpm build` is Docker/Node (standalone Next). Cloudflare Builds
 * auto-detects Next.js and runs the same script, which then uses Turbopack
 * and crashes on Sharp's libvips directory.
 *
 * When WORKERS_CI or CLOUDFLARE_BUILD is set, run the OpenNext webpack
 * Worker build instead.
 */
import { spawnSync } from 'node:child_process'

const env = { ...process.env }
const onWorkers =
  env.WORKERS_CI === '1' ||
  env.WORKERS_CI === 'true' ||
  env.CLOUDFLARE_BUILD === '1'

/**
 * @param {string} command
 * @param {string[]} args
 */
function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit', env })
  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}

if (onWorkers) {
  env.CLOUDFLARE_BUILD = '1'
  console.log(
    'Workers CI / CLOUDFLARE_BUILD: OpenNext webpack build (skipping `next build` Turbopack)',
  )
  run('pnpm', ['exec', 'opennextjs-cloudflare', 'build'])
  run('node', ['scripts/pin-cf-worker-name.mjs'])
  process.exit(0)
}

run('pnpm', ['generate:importmap'])
run('pnpm', ['exec', 'next', 'build'])
