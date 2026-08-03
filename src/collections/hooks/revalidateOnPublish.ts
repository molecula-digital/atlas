import type { CollectionAfterChangeHook } from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'
import { ENTRY_TYPE_CONFIG, type AtlasEntryType } from '../../config'

/**
 * Safely call revalidatePath/revalidateTag — these only work inside a Next.js
 * request context. When Payload runs outside Next.js (e.g. seed scripts, CLI),
 * they throw. We catch and ignore those errors.
 */
function safeRevalidatePath(path: string) {
  try {
    revalidatePath(path)
  } catch {
    // Outside Next.js request context — skip silently
  }
}

function safeRevalidateTag(tag: string) {
  try {
    revalidateTag(tag, 'max')
  } catch {
    // Outside Next.js request context — skip silently
  }
}

/**
 * Revalidate static pages when a document's publish status changes.
 * Attached to entries, news, events, and jobs collections.
 */
export const revalidateEntry: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
}) => {
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc._status === 'published'

  // Only revalidate when publish status changes
  if (!wasPublished && !isPublished) return doc

  if (collection.slug === 'entries') {
    const entryType = doc.entryType as AtlasEntryType
    const categorySlug = ENTRY_TYPE_CONFIG[entryType]?.slug

    safeRevalidatePath('/')
    safeRevalidatePath('/directorio')
    if (categorySlug) {
      safeRevalidatePath(`/${categorySlug}`)
      if (doc.slug) safeRevalidatePath(`/${categorySlug}/${doc.slug}`)
    }
    if (doc.city) safeRevalidatePath(`/directorio/${doc.city}`)
  }

  if (collection.slug === 'news') {
    safeRevalidatePath('/')
    safeRevalidatePath('/noticias')
    if (doc.slug) safeRevalidatePath(`/noticias/${doc.slug}`)
  }

  if (collection.slug === 'events') {
    safeRevalidatePath('/')
    safeRevalidatePath('/eventos')
    if (doc.slug) safeRevalidatePath(`/eventos/${doc.slug}`)
  }

  if (collection.slug === 'jobs') {
    safeRevalidatePath('/')
    safeRevalidatePath('/empleos')
    if (doc.slug) safeRevalidatePath(`/empleos/${doc.slug}`)
  }

  safeRevalidateTag(collection.slug)

  return doc
}
