#!/usr/bin/env node
/**
 * Cloudflare Builds sets WRANGLER_CI_OVERRIDE_NAME to the dashboard Worker
 * (`atlas`) and only overrides wrangler `name` on upload. WORKER_SELF_REFERENCE
 * is left pointing at whatever is in wrangler.jsonc — historically the npm
 * package name `atlas-tech`, which is not a Worker, so deploy fails with
 * API 10143.
 *
 * Run this after `opennextjs-cloudflare build` and immediately before
 * `wrangler deploy` so the self-binding always targets the script being
 * uploaded.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const wranglerPath = fileURLToPath(new URL('../wrangler.jsonc', import.meta.url))
const DASHBOARD_WORKER = 'atlas'

const workerName = (process.env.WRANGLER_CI_OVERRIDE_NAME || DASHBOARD_WORKER).trim()

if (!/^[a-z0-9-]+$/.test(workerName)) {
  console.error(`pin-cf-worker-name: invalid Worker name "${workerName}"`)
  process.exit(1)
}

let source = readFileSync(wranglerPath, 'utf8')

source = source.replace(/^(\s*"name"\s*:\s*")[^"]+(")/m, `$1${workerName}$2`)

const selfRef =
  /("binding"\s*:\s*"WORKER_SELF_REFERENCE"[\s\S]*?"service"\s*:\s*")[^"]+(")/
if (!selfRef.test(source)) {
  console.error(
    'pin-cf-worker-name: WORKER_SELF_REFERENCE service field not found in wrangler.jsonc',
  )
  process.exit(1)
}
source = source.replace(selfRef, `$1${workerName}$2`)

const nameMatch = source.match(/^(\s*"name"\s*:\s*")([^"]+)(")/m)
const serviceMatch = source.match(
  /"binding"\s*:\s*"WORKER_SELF_REFERENCE"[\s\S]*?"service"\s*:\s*"([^"]+)"/,
)
if (nameMatch?.[2] !== workerName || serviceMatch?.[1] !== workerName) {
  console.error(
    `pin-cf-worker-name: expected name and WORKER_SELF_REFERENCE to be "${workerName}"`,
  )
  process.exit(1)
}

writeFileSync(wranglerPath, source)
console.log(
  `Pinned wrangler.jsonc name and WORKER_SELF_REFERENCE to "${workerName}"`,
)
