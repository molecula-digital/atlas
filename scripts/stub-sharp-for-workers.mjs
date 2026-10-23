#!/usr/bin/env node
/**
 * OpenNext esbuild bundles `next/dist/server/image-optimizer.js`, which
 * `require`s sharp. Webpack aliases do not apply to that pass, so native
 * libvips lands in worker.js and crashes the Worker on the first request.
 *
 * Replace every installed sharp entry with a JS stub before OpenNext runs.
 * Writes break pnpm store hardlinks (unlink + recreate) and keep a sidecar
 * backup so `--restore` can put Docker/Node Sharp back.
 */
import { createRequire } from 'node:module'
import {
  copyFileSync,
  existsSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const restore = process.argv.includes('--restore')
const stubEsm = readFileSync(join(root, 'stubs/empty-sharp.js'), 'utf8')
const stubCjs = readFileSync(join(root, 'stubs/empty-sharp.cjs'), 'utf8')
const backupSuffix = '.workers-stub-orig'

const roots = new Set()

try {
  roots.add(
    dirname(createRequire(import.meta.url).resolve('sharp/package.json')),
  )
} catch {
  // sharp may be absent in a pruned install
}

const pnpmDir = join(root, 'node_modules/.pnpm')
if (existsSync(pnpmDir)) {
  for (const name of readdirSync(pnpmDir)) {
    if (!name.startsWith('sharp@')) continue
    const pkg = join(pnpmDir, name, 'node_modules/sharp/package.json')
    if (existsSync(pkg)) {
      roots.add(dirname(pkg))
    }
  }
}

const esmFiles = ['dist/index.mjs', 'dist/constructor.mjs', 'dist/sharp.mjs']
const cjsFiles = ['dist/index.cjs', 'dist/constructor.cjs', 'dist/sharp.cjs']
const targets = [
  ...esmFiles.map((rel) => ({ rel, contents: stubEsm })),
  ...cjsFiles.map((rel) => ({ rel, contents: stubCjs })),
]

/**
 * @param {string} dest
 */
function backupPath(dest) {
  return `${dest}${backupSuffix}`
}

/**
 * Break a pnpm store hardlink, then write. Mutating in place would rewrite
 * the global content-addressed store.
 *
 * @param {string} dest
 * @param {string} contents
 */
function replaceBreakingHardlink(dest, contents) {
  const backup = backupPath(dest)
  if (!existsSync(backup)) {
    copyFileSync(dest, backup)
  }
  unlinkSync(dest)
  writeFileSync(dest, contents)
}

/**
 * @param {string} dest
 */
function restoreFromBackup(dest) {
  const backup = backupPath(dest)
  if (!existsSync(backup)) {
    return false
  }
  if (existsSync(dest)) {
    unlinkSync(dest)
  }
  copyFileSync(backup, dest)
  unlinkSync(backup)
  return true
}

let written = 0
let restored = 0
for (const dir of roots) {
  for (const { rel, contents } of targets) {
    const dest = join(dir, rel)
    if (restore) {
      if (restoreFromBackup(dest)) {
        restored += 1
      }
      continue
    }
    if (existsSync(dest)) {
      replaceBreakingHardlink(dest, contents)
      written += 1
    }
  }
}

if (restore) {
  console.log(
    `stub-sharp-for-workers: restored ${restored} sharp file(s) in ${roots.size} package(s)`,
  )
  process.exit(0)
}

if (written === 0) {
  console.warn('stub-sharp-for-workers: no sharp entry files found')
} else {
  console.log(
    `stub-sharp-for-workers: replaced ${written} sharp file(s) in ${roots.size} package(s)`,
  )
}
