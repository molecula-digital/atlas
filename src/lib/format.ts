import { toPublicMediaUrl } from '@/lib/media-url'

/**
 * Format an ISO date string to Spanish locale (es-MX).
 */
export function formatDateEs(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Extract URL from a Payload media/upload field (which can be `number | { url: string } | null`).
 * Rewrites legacy R2 / media hosts to the CDN.
 */
export function extractImageUrl(field: unknown): string | null {
  if (typeof field === 'object' && field !== null && 'url' in field) {
    return toPublicMediaUrl((field as { url: string }).url)
  }
  return null
}

export interface SocialImage {
  url: string
  width?: number
  height?: number
  alt?: string
  type?: string
}

/**
 * Prefer Payload's 1200×630 cover derivative for social previews, falling
 * back to the original upload when the derivative is unavailable.
 */
export function extractSocialImage(field: unknown, fallbackAlt?: string): SocialImage | null {
  if (typeof field !== 'object' || field === null) return null

  const media = field as {
    url?: string | null
    width?: number | null
    height?: number | null
    alt?: string | null
    mimeType?: string | null
    sizes?: {
      cover?: {
        url?: string | null
        width?: number | null
        height?: number | null
        mimeType?: string | null
      } | null
    } | null
  }
  const cover = media.sizes?.cover
  const source = cover?.url ? cover : media
  const url = toPublicMediaUrl(source.url)
  if (!url) return null

  const alt = media.alt || fallbackAlt

  return {
    url,
    ...(source.width ? { width: source.width } : {}),
    ...(source.height ? { height: source.height } : {}),
    ...(alt ? { alt } : {}),
    ...(source.mimeType ? { type: source.mimeType } : {}),
  }
}
