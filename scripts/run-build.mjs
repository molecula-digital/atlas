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
  return result.status ?? 1
}

/**
 * @param {string} command
 * @param {string[]} args
 */
function runOrExit(command, args) {
  const status = run(command, args)
  if (status !== 0) {
    process.exit(status)
  }
}

if (onWorkers) {
  env.CLOUDFLARE_BUILD = '1'
  console.log(
    'Workers CI / CLOUDFLARE_BUILD: OpenNext webpack build (skipping `next build` Turbopack)',
  )
  runOrExit('node', ['scripts/stub-sharp-for-workers.mjs'])
  let status = 0
  try {
    status = run('pnpm', ['exec', 'opennextjs-cloudflare', 'build'])
    if (status === 0) {
      status = run('node', ['scripts/pin-cf-worker-name.mjs'])
    }
    if (status === 0) {
      status = run('node', ['scripts/assert-no-native-sharp.mjs'])
    }
  } finally {
    run('node', ['scripts/stub-sharp-for-workers.mjs', '--restore'])
  }
  process.exit(status)
}

runOrExit('pnpm', ['generate:importmap'])
runOrExit('pnpm', ['exec', 'next', 'build'])
