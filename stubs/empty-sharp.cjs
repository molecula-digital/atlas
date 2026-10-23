// CommonJS copy of empty-sharp.js for `require('sharp')`.

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

module.exports = sharp
module.exports.default = sharp
