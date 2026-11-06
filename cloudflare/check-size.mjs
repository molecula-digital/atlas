#!/usr/bin/env node
/**
 * Fail if the Wrangler Worker script gzip exceeds the paid-plan cap (10 MiB).
 * Static assets are ignored — only `Total Upload / gzip` counts.
 */
import { spawnSync } from 'node:child_process'

const PAID_GZIP_KIB = 10 * 1024

const result = spawnSync(
  'pnpm',
  [
    'exec',
    'wrangler',
    'deploy',
    '--dry-run',
    '--outdir',
    '/tmp/cf-bundle-size',
  ],
  { encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 },
)

const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`
process.stdout.write(result.stdout ?? '')
process.stderr.write(result.stderr ?? '')

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

const match = output.match(
  /Total Upload:\s*([\d.]+)\s*KiB\s*\/\s*gzip:\s*([\d.]+)\s*KiB/i,
)
if (!match) {
  console.error(
    'check-worker-size: could not parse wrangler Total Upload / gzip line',
  )
  process.exit(1)
}

const uncompressedKiB = Number(match[1])
const gzipKiB = Number(match[2])
const headroomKiB = PAID_GZIP_KIB - gzipKiB

console.log(
  `\nWorker script gzip: ${gzipKiB.toFixed(2)} KiB / ${PAID_GZIP_KIB} KiB paid cap (${headroomKiB >= 0 ? '+' : ''}${headroomKiB.toFixed(2)} KiB)`,
)
console.log(
  `Uncompressed: ${uncompressedKiB.toFixed(2)} KiB / ${64 * 1024} KiB cap`,
)

if (gzipKiB > PAID_GZIP_KIB) {
  console.error(
    `Worker gzip ${gzipKiB.toFixed(2)} KiB exceeds the 10 MiB paid Cloudflare limit.`,
  )
  process.exit(1)
}
