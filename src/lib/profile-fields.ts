/** Shared profile field helpers (slug + website normalization). */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function slugifyProfile(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60)
}

export function isValidProfileSlug(slug: string): boolean {
  return slug.length >= 2 && slug.length <= 60 && SLUG_RE.test(slug)
}

/**
 * Accepts bare domains like "hola.com" or full URLs.
 * Returns normalized https URL, or null for empty input.
 */
export function normalizeWebsite(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    const url = new URL(withProtocol)
    if (!url.hostname.includes('.')) return null
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export function isValidWebsiteInput(value: string): boolean {
  const trimmed = value.trim()
  if (!trimmed) return true
  return normalizeWebsite(trimmed) !== null
}
