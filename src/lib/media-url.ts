/**
 * Public media must be served through the Cloudflare CDN custom domain.
 * S3/R2 endpoints are for authenticated API access only — never browser fetches.
 */

export const MEDIA_CDN_ORIGIN = 'https://cdn.atlas-sinaloa.tech'
export const MEDIA_CDN_HOST = 'cdn.atlas-sinaloa.tech'

/** Older public hosts that may still appear in stored URLs. */
const LEGACY_MEDIA_HOSTS = new Set(['media.atlas-sinaloa.tech'])

function isR2Hostname(hostname: string): boolean {
  return hostname === 'r2.cloudflarestorage.com' || hostname.endsWith('.r2.cloudflarestorage.com')
}

function isBucketPublicHost(hostname: string): boolean {
  return hostname === MEDIA_CDN_HOST || LEGACY_MEDIA_HOSTS.has(hostname) || isR2Hostname(hostname)
}

/** MEDIA_URL with no trailing slash. Local MinIO or the CDN in production. */
export function getMediaBaseUrl(): string {
  const fromEnv = process.env.MEDIA_URL?.trim()
  if (fromEnv) return fromEnv.replace(/\/+$/, '')
  return MEDIA_CDN_ORIGIN
}

/**
 * Build the public URL for an object key (e.g. `media/photo.jpg`).
 * Uses MEDIA_URL locally; production should set MEDIA_URL to the CDN origin.
 */
export function buildMediaFileUrl(filename: string, prefix = ''): string {
  const base = getMediaBaseUrl()
  const filePath = prefix ? `${prefix.replace(/\/+$/, '')}/${filename}` : filename
  return toPublicMediaUrl(`${base}/${filePath.replace(/^\/+/, '')}`) ?? `${base}/${filePath.replace(/^\/+/, '')}`
}

/**
 * Rewrite bucket / legacy media hosts to the CDN. Leaves Google avatars,
 * blob previews, and local MinIO URLs untouched.
 */
export function toPublicMediaUrl(input: string | null | undefined): string | null {
  if (input == null) return null
  const value = input.trim()
  if (!value) return null
  if (value.startsWith('blob:') || value.startsWith('data:')) return value

  let url: URL
  try {
    url = new URL(value)
  } catch {
    // Relative keys like `media/foo.jpg` or `/media/foo.jpg`
    const base = getMediaBaseUrl()
    return toPublicMediaUrl(`${base}/${value.replace(/^\/+/, '')}`)
  }

  if (!isBucketPublicHost(url.hostname)) {
    return value
  }

  let pathname = url.pathname || '/'
  const bucket = process.env.S3_BUCKET?.trim()
  if (bucket) {
    const bucketPrefix = `/${bucket}`
    if (pathname === bucketPrefix || pathname.startsWith(`${bucketPrefix}/`)) {
      pathname = pathname.slice(bucketPrefix.length) || '/'
    }
  }

  if (!pathname.startsWith('/')) pathname = `/${pathname}`

  return `${MEDIA_CDN_ORIGIN}${pathname}${url.search}`
}
