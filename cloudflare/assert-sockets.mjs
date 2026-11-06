#!/usr/bin/env node
/**
 * The Worker must not resolve cloudflare:sockets through Node's require.
 * pg-cloudflare should call globalThis.__cloudflareConnect, installed by
 * cloudflare/worker.mjs with a static import.
 */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const roots = ['.open-next']
const files = []

function walk(dir) {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      if (name === 'node_modules' || name === 'cache') continue
      walk(path)
      continue
    }
    if (/\.(m?js|cjs)$/.test(name)) files.push(path)
  }
}

for (const root of roots) walk(root)

if (files.length === 0) {
  console.error('assert-cloudflare-sockets: no OpenNext bundle found')
  process.exit(1)
}

const dynamic = []
let usesConnect = false
for (const file of files) {
  const source = readFileSync(file, 'utf8')
  if (/import\s*\(\s*['"]cloudflare:sockets['"]\s*\)/.test(source)) {
    dynamic.push(file)
  }
  if (source.includes('__cloudflareConnect')) usesConnect = true
}

if (dynamic.length > 0) {
  console.error(
    `assert-cloudflare-sockets: bundle still imports cloudflare:sockets dynamically (${dynamic.join(', ')})`,
  )
  process.exit(1)
}

if (!usesConnect) {
  console.error(
    'assert-cloudflare-sockets: bundle does not call globalThis.__cloudflareConnect',
  )
  process.exit(1)
}

console.log(
  'assert-cloudflare-sockets: Postgres uses the static Workers socket',
)
