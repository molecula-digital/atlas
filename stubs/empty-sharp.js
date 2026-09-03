// No-op Sharp for Cloudflare Workers. OpenNext esbuild inlines
// `require('sharp')` from Next's image-optimizer even though that
// path is lazy in Node — native libvips then throws on the first GET.
function chain() {
  return api
}

const api = {
  rotate: chain,
  resize: chain,
  jpeg: chain,
  png: chain,
  webp: chain,
  avif: chain,
  gif: chain,
  tiff: chain,
  clone: chain,
  withMetadata: chain,
  toFormat: chain,
  toBuffer: async () => Buffer.alloc(0),
  toFile: async () => ({ size: 0 }),
  metadata: async () => ({}),
}

function sharp() {
  return api
}

sharp.block = () => {}
sharp.unblock = () => {}
sharp.cache = () => {}
sharp.concurrency = () => 1
sharp.format = {}
sharp.versions = { sharp: '0.0.0-workers-stub' }

export default sharp
