import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Safely call revalidatePath/revalidateTag — these only work inside a Next.js
 * request context. When Payload runs outside Next.js (e.g. seed scripts, CLI),
 * they throw. We catch and ignore those errors.
 */
function safeRevalidateAll() {
  try {
    // Root layout: invalidates every cached page under the app.
    revalidatePath('/', 'layout')
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
 * Revalidate the site when a published (or previously published) document
 * changes. Attached to entries, news, events, and jobs collections.
 */
export const revalidateEntry: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  collection,
}) => {
  const wasPublished = previousDoc?._status === 'published'
  const isPublished = doc._status === 'published'

  // Draft-only creates/edits do not affect public pages or counts.
  if (!wasPublished && !isPublished) return doc

  safeRevalidateAll()
  safeRevalidateTag(collection.slug)

  return doc
}

/** Same as afterChange, for deletes of published documents. */
export const revalidateEntryDelete: CollectionAfterDeleteHook = ({
  doc,
  collection,
}) => {
  if (doc._status !== 'published') return doc

  safeRevalidateAll()
  safeRevalidateTag(collection.slug)

  return doc
}
