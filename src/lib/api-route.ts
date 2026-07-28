import type { PaginatedResponse } from '@/lib/api'

interface PaginationOptions {
  defaultLimit?: number
  maxLimit?: number
}

/** Reads and clamps `?page=`/`?limit=`. NaN, zero, and negatives fall back to the floor. */
export function parsePagination(
  searchParams: URLSearchParams,
  { defaultLimit = 12, maxLimit = 100 }: PaginationOptions = {},
): { page: number; limit: number } {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') || String(defaultLimit), 10) || defaultLimit),
    maxLimit,
  )
  return { page, limit }
}

/**
 * Projects a Payload find() result onto the response shape the client's
 * PaginatedResponse expects — the contract three routes were spelling out by
 * hand, plus two more branches inside the entries route.
 */
export function toPaginatedResponse<T>(result: {
  docs: T[]
  totalDocs: number
  totalPages: number
  page?: number | null
  hasNextPage: boolean
  hasPrevPage: boolean
}): PaginatedResponse<T> {
  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page ?? 1,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  }
}
