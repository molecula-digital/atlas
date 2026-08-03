import { spawn } from 'node:child_process'

if (!process.env.DATABASE_DIRECT_URL) {
  console.error('DATABASE_DIRECT_URL is not set')
  process.exit(1)
}

const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const child = spawn(
  command,
  ['exec', 'payload', 'migrate', ...process.argv.slice(2)],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_DIRECT_URL,
    },
  },
)

child.on('error', (error) => {
  console.error('Failed to start Payload migrations:', error)
  process.exit(1)
})

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
    return
  }
  process.exit(code ?? 1)
})
