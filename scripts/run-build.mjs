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
import {
  infisicalCredentialsPresent,
  loadInfisicalSecrets,
} from './load-infisical-secrets.mjs'

const workersRequested =
  process.env.WORKERS_CI === '1' ||
  process.env.WORKERS_CI === 'true' ||
  process.env.CLOUDFLARE_BUILD === '1'

if (workersRequested && !infisicalCredentialsPresent()) {
  console.warn(
    'Infisical credentials are not in this build environment. wrangler secret put only stores them on the running Worker. Add CF_ACCESS_CLIENT_ID, CF_ACCESS_CLIENT_SECRET, INFISICAL_CLIENT_ID, and INFISICAL_CLIENT_SECRET under Builds → Variables and secrets.',
  )
} else {
  await loadInfisicalSecrets()
}

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
  // Stub before Next compiles. The image loader calls Sharp for static
  // images; the stub returns the original bytes. OpenNext's esbuild pass
  // then inlines that stub instead of libvips.
  runOrExit('node', ['scripts/stub-sharp-for-workers.mjs'])
  runOrExit('node', ['scripts/use-pg-cloudflare-workerd.mjs'])
  let status = 0
  try {
    status = run('pnpm', ['exec', 'opennextjs-cloudflare', 'build'])
    if (status === 0) {
      status = run('node', ['scripts/pin-cf-worker-name.mjs'])
    }
    if (status === 0) {
      status = run('node', ['scripts/assert-no-native-sharp.mjs'])
    }
    if (status === 0) {
      status = run('node', ['scripts/assert-cloudflare-sockets.mjs'])
    }
  } finally {
    run('node', ['scripts/use-pg-cloudflare-workerd.mjs', '--restore'])
    run('node', ['scripts/stub-sharp-for-workers.mjs', '--restore'])
  }
  process.exit(status)
}

runOrExit('pnpm', ['generate:importmap'])
runOrExit('pnpm', ['exec', 'next', 'build'])
