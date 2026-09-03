/**
 * Cloudflare Workers Builds injects WORKERS_CI=1 and often runs
 * `pnpm run build` (the Next.js default) instead of `pnpm cf:build`.
 * Treat that the same as CLOUDFLARE_BUILD=1 so Sharp is stubbed and
 * OpenNext uses webpack instead of Turbopack.
 */
export function isCloudflareBuildEnv(
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return (
    env.CLOUDFLARE_BUILD === '1' ||
    env.WORKERS_CI === '1' ||
    env.WORKERS_CI === 'true'
  )
}
