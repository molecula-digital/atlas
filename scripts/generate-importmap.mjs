#!/usr/bin/env node
/**
 * Payload admin routes import `../importMap` / `./admin/importMap`.
 * Cloudflare Builds clones a clean tree, so this must write the file and
 * fail the build if it does not land where webpack expects it.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const dest = fileURLToPath(
  new URL('../src/app/(payload)/admin/importMap.js', import.meta.url),
)

const result = spawnSync('pnpm', ['exec', 'payload', 'generate:importmap'], {
  stdio: 'inherit',
  env: process.env,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

if (
  !existsSync(dest) ||
  !readFileSync(dest, 'utf8').includes('export const importMap')
) {
  console.error(
    `payload generate:importmap did not write ${dest}. Webpack cannot resolve the Payload admin import map.`,
  )
  process.exit(1)
}
