// No-op Sharp for Cloudflare Workers. OpenNext esbuild inlines
// `require('sharp')` from Next's image-optimizer even though that
// path is lazy in Node — native libvips then throws on the first GET.
//
// `next build` also calls this while compiling static images, so the
// chain has to accept the real methods (`timeout`, `toBuffer`, …) and
// hand the original bytes back.

function sharp(input) {
  const buffer = Buffer.isBuffer(input) ? input : Buffer.alloc(0)
  const api = {
    timeout: () => api,
    rotate: () => api,
    resize: () => api,
    jpeg: () => api,
    png: () => api,
    webp: () => api,
    avif: () => api,
    gif: () => api,
    tiff: () => api,
    clone: () => api,
    withMetadata: () => api,
    toFormat: () => api,
    toBuffer: async () => buffer,
    toFile: async () => ({ size: buffer.length }),
    metadata: async () => ({}),
  }
  return api
}

sharp.block = () => {}
sharp.unblock = () => {}
sharp.cache = () => {}
sharp.concurrency = () => 1
sharp.format = {}
sharp.versions = { sharp: '0.0.0-workers-stub' }

export default sharp
