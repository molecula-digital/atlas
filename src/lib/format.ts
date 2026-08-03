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

const MAX_SOCIAL_IMAGE_BYTES = 1_000_000

/**
 * Prefer Payload's 1200×630 cover derivative for social previews. If that
 * derivative is heavier than 1 MB, use the smaller card derivative instead.
 * Falls back to the original upload when neither generated size is available.
 */
export function extractSocialImage(
  field: unknown,
  fallbackAlt?: string,
): SocialImage | null {
  if (typeof field !== 'object' || field === null) return null

  const media = field as {
    url?: string | null
    width?: number | null
    height?: number | null
    alt?: string | null
    mimeType?: string | null
    filesize?: number | null
    sizes?: {
      cover?: {
        url?: string | null
        width?: number | null
        height?: number | null
        mimeType?: string | null
        filesize?: number | null
      } | null
      card?: {
        url?: string | null
        width?: number | null
        height?: number | null
        mimeType?: string | null
        filesize?: number | null
      } | null
    } | null
  }
  const cover = media.sizes?.cover
  const card = media.sizes?.card
  const coverIsTooHeavy =
    typeof cover?.filesize === 'number' &&
    cover.filesize > MAX_SOCIAL_IMAGE_BYTES
  const source =
    cover?.url && !coverIsTooHeavy
      ? cover
      : card?.url
        ? card
        : cover?.url
          ? cover
          : media
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

/** Collapse whitespace and truncate copy at a word boundary for metadata. */
export function truncateMetadataText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized

  const slice = normalized.slice(0, Math.max(1, maxLength - 1))
  const lastSpace = slice.lastIndexOf(' ')
  const boundary =
    lastSpace >= Math.floor(maxLength * 0.7) ? lastSpace : slice.length

  return `${slice.slice(0, boundary).trimEnd()}…`
}
