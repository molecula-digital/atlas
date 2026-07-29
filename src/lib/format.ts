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
