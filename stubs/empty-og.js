// Next.js traces `@vercel/og` from shared server code even when this app only
// uses a static `/og.jpg`. The Worker must not ship resvg.wasm (~1.4 MiB).
export function ImageResponse() {
  throw new Error('@vercel/og is not bundled for Cloudflare Workers')
}

export function unstable_createNodejsStream() {
  throw new Error('@vercel/og is not bundled for Cloudflare Workers')
}
