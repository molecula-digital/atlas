import { ENTRY_TYPES, getEntryUrl, type AtlasEntryType } from '@/config'

type PreviewDocument = {
  entryType?: unknown
  slug?: unknown
}

function getPublicPreviewPath(
  collection: string,
  document: PreviewDocument,
): string | null {
  if (typeof document.slug !== 'string') return null

  switch (collection) {
    case 'entries': {
      const entryType = document.entryType as AtlasEntryType
      return ENTRY_TYPES.includes(entryType)
        ? getEntryUrl(entryType, document.slug)
        : null
    }
    case 'news':
      return `/noticias/${document.slug}`
    case 'jobs':
      return `/empleos/${document.slug}`
    case 'events':
      return `/eventos/${document.slug}`
    default:
      return null
  }
}

/**
 * Creates the authenticated draft-preview URL shown in Payload's edit view.
 * Preview is intentionally unavailable until PREVIEW_SECRET is configured.
 */
export function buildPayloadPreviewUrl(path: string): string | null {
  const previewSecret = process.env.PREVIEW_SECRET
  if (!previewSecret) return null

  const params = new URLSearchParams({ path, previewSecret })
  return `/api/preview?${params.toString()}`
}

export function getPayloadPreviewUrl(
  collection: string,
  document: PreviewDocument,
): string | null {
  const path = getPublicPreviewPath(collection, document)
  return path ? buildPayloadPreviewUrl(path) : null
}
