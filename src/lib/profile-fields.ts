/** Shared profile field helpers (slug, website and bio normalization). */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/** Characters allowed in the free-text profile bio. */
export const PROFILE_BIO_MAX_LENGTH = 600

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

/**
 * Free-text bio shown on the public profile.
 *
 * Paragraph breaks survive because people write bios in a textarea, but runs of
 * spaces and blank lines are collapsed so a paste out of a CV cannot stretch the
 * profile card. Returns null for empty input, keeping the column NULL rather
 * than storing an empty string.
 */
export function normalizeBio(value: string): string | null {
  const cleaned = value
    .replace(/\r\n?/g, '\n')
    .replace(/[^\S\n]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return cleaned || null
}

export function isValidBioInput(value: string): boolean {
  const normalized = normalizeBio(value)
  return normalized === null || normalized.length <= PROFILE_BIO_MAX_LENGTH
}
