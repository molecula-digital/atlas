/**
 * Cloudflare Workers bindings. Regenerate with `pnpm cf-typegen` after
 * changing wrangler.jsonc. The Hyperdrive binding is optional.
 */
interface CloudflareEnv {
  HYPERDRIVE?: {
    connectionString: string
  }
}
