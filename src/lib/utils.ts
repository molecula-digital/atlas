import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { SITE_URL } from '@/config'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildTrackedUrl(
  url: string,
  slug: string,
  medium = 'directorio',
): string {
  try {
    const u = new URL(url)
    u.searchParams.set('utm_source', new URL(SITE_URL).hostname)
    u.searchParams.set('utm_medium', medium)
    u.searchParams.set('utm_content', slug)
    return u.toString()
  } catch {
    return url
  }
}

/** Flatten Payload array fields: [{tag: "x"}, {tag: "y"}] → ["x", "y"] */
export function flattenArray<T>(
  arr: Array<Record<string, T>> | undefined | null,
  key: string,
): T[] {
  if (!arr) return []
  return arr.map((item) => item[key]).filter(Boolean)
}

/** Convert an ISO date string to a Spanish relative time string */
export function timeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 60) return 'hace unos minutos'
  if (diffHours < 24)
    return `hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`
  if (diffDays < 30) return `hace ${diffDays} día${diffDays === 1 ? '' : 's'}`
  return new Date(dateStr).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Safely serialize data for JSON-LD script blocks, preventing XSS via </script> injection */
export function safeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

/** Convert an ISO expiration date to a Spanish countdown/elapsed string */
export function expirationLabel(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = then - now
  const diffDays = Math.floor(Math.abs(diffMs) / 86400000)

  if (diffMs > 0) return `Expira en ${diffDays} día${diffDays === 1 ? '' : 's'}`
  return `Expiró hace ${diffDays} día${diffDays === 1 ? '' : 's'}`
}
