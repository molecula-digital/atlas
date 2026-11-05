#!/usr/bin/env node
/**
 * Fail if the OpenNext Worker still contains native Sharp. Webpack aliases
 * do not apply to OpenNext's esbuild pass, so this is the last gate.
 *
 * Do not match `node_modules/.pnpm/sharp@` — esbuild keeps that path in
 * comments even when the file was replaced with the JS stub.
 */
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const workerPath = fileURLToPath(
  new URL('../.open-next/worker.js', import.meta.url),
)

if (!existsSync(workerPath)) {
  console.error('assert-no-native-sharp: .open-next/worker.js not found')
  process.exit(1)
}

const worker = readFileSync(workerPath, 'utf8')
const needles = [
  '@img/sharp-libvips',
  '@img/sharp-linux',
  '@img/sharp-wasm32',
  'Could not load the "sharp" module',
  'runtimePlatformArch',
  'sharp.node',
  'Prebuilt binaries for Linux x64',
]

const hits = needles.filter((needle) => worker.includes(needle))
if (hits.length > 0) {
  console.error(
    `assert-no-native-sharp: worker.js still contains native Sharp (${hits.join(', ')})`,
  )
  process.exit(1)
}

console.log('assert-no-native-sharp: worker.js has no native Sharp')
