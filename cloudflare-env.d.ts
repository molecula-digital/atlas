/**
 * Cloudflare Workers bindings. Regenerate with `pnpm cf-typegen` after
 * changing wrangler.jsonc. The Hyperdrive binding is optional.
 *
 * ISR cache binding (`NEXT_INC_CACHE_R2_BUCKET`) lives in wrangler.jsonc;
 * run cf-typegen to refresh this file after a deploy config change.
 */
interface CloudflareEnv {
  HYPERDRIVE?: {
    connectionString: string
  }
  /** Worker secret. Not a wrangler binding; set in the dashboard. */
  CRON_SECRET?: string
}
