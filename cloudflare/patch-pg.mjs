#!/usr/bin/env node
/**
 * `pg-cloudflare` publishes an empty module as its default export so Node
 * builds do not touch `cloudflare:sockets`. Bundlers that miss the `workerd`
 * condition inline that empty object, and `new CloudflareSocket()` becomes
 * `o is not a constructor` on the first Postgres query.
 *
 * Point the default export at the real socket for the Workers build, then
 * restore it. The socket connects through `globalThis.__cloudflareConnect`,
 * which the Worker entry sets from a static `cloudflare:sockets` import.
 * A dynamic import of that specifier is handled by the Node compatibility
 * loader and throws "Cannot find module 'cloudflare:sockets'".
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
const backupSuffix = '.workers-socket-orig'

const SOCKET_IMPORT =
  /const mod = await import\((['"])cloudflare:sockets\1\);\s*const connect = mod\.connect;/g

const SOCKET_REPLACEMENT = `const connect = globalThis.__cloudflareConnect;
            if (typeof connect !== "function") {
                throw new Error("Workers TCP connect is not installed");
            }`

const packages = new Set()

function addPackage(packageJsonPath) {
  if (existsSync(packageJsonPath)) packages.add(packageJsonPath)
}

try {
  addPackage(
    createRequire(import.meta.url).resolve('pg-cloudflare/package.json'),
  )
} catch {
  // absent in a pruned install
}

const pnpmDir = join(root, 'node_modules/.pnpm')
if (existsSync(pnpmDir)) {
  for (const name of readdirSync(pnpmDir)) {
    if (!name.startsWith('pg-cloudflare@')) continue
    addPackage(join(pnpmDir, name, 'node_modules/pg-cloudflare/package.json'))
  }
}

function backupPath(file) {
  return `${file}${backupSuffix}`
}

function writeBreakingHardlink(file, contents) {
  const backup = backupPath(file)
  if (!existsSync(backup)) copyFileSync(file, backup)
  unlinkSync(file)
  writeFileSync(file, contents)
}

function socketFiles(packageJsonPath) {
  const dir = dirname(packageJsonPath)
  return [join(dir, 'dist/index.js'), join(dir, 'esm/index.mjs')].filter(
    (file) => existsSync(file),
  )
}

let changed = 0
let restored = 0

for (const file of packages) {
  if (restore) {
    for (const target of [file, ...socketFiles(file)]) {
      const backup = backupPath(target)
      if (!existsSync(backup)) continue
      if (existsSync(target)) unlinkSync(target)
      copyFileSync(backup, target)
      unlinkSync(backup)
      restored += 1
    }
    continue
  }

  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  const entry = pkg.exports?.['.']
  if (!entry || typeof entry !== 'object') continue
  if (entry.default === './dist/index.js') continue
  entry.default = './dist/index.js'
  writeBreakingHardlink(file, `${JSON.stringify(pkg, null, 2)}\n`)
  changed += 1

  for (const socketFile of socketFiles(file)) {
    const source = readFileSync(socketFile, 'utf8')
    if (!SOCKET_IMPORT.test(source)) {
      SOCKET_IMPORT.lastIndex = 0
      continue
    }
    SOCKET_IMPORT.lastIndex = 0
    writeBreakingHardlink(
      socketFile,
      source.replace(SOCKET_IMPORT, SOCKET_REPLACEMENT),
    )
    changed += 1
  }
}

if (restore) {
  console.log(`use-pg-cloudflare-workerd: restored ${restored} package(s)`)
} else {
  console.log(
    `use-pg-cloudflare-workerd: pointed ${changed} package(s) at the workerd socket`,
  )
}
