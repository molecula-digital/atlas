'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { fetchPaginated, type PaginatedResponse } from '@/lib/api'

interface UsePaginatedDataOptions {
  endpoint: string
  params?: Record<string, string>
  pageSize: number
  /** Element scrolled into view on page change; falls back to the top of the page. */
  scrollTargetId?: string
}

interface UsePaginatedDataResult<T> {
  data: PaginatedResponse<T> | null
  loading: boolean
  page: number
  setPage: (page: number) => void
}

/**
 * Owns the paging half of a paginated list: the request, the `?page=` query
 * param, and the scroll on page change. Rendering stays with the caller.
 */
export function usePaginatedData<T>({
  endpoint,
  params,
  pageSize,
  scrollTargetId,
}: UsePaginatedDataOptions): UsePaginatedDataResult<T> {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [page, setPageState] = useState(() => {
    if (typeof window === 'undefined') return 1
    const p = parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10)
    return p > 0 ? p : 1
  })

  // Stabilize params reference to avoid infinite re-fetch loops
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params])

  const fetchData = useCallback(
    async (target: number) => {
      setLoading(true)
      try {
        const stableParams = JSON.parse(paramsKey) as Record<string, string>
        const result = await fetchPaginated<T>(endpoint, {
          ...stableParams,
          page: String(target),
          limit: String(pageSize),
        })
        setData(result)
      } catch (err) {
        console.error('usePaginatedData fetch error:', err)
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [endpoint, paramsKey, pageSize],
  )

  // Reset to page 1 when params change
  useEffect(() => {
    setPageState(1)
  }, [paramsKey])

  useEffect(() => {
    fetchData(page)
  }, [fetchData, page])

  const setPage = useCallback(
    (target: number) => {
      setPageState(target)
      const url = new URL(window.location.href)
      if (target <= 1) url.searchParams.delete('page')
      else url.searchParams.set('page', String(target))
      window.history.pushState({}, '', url.pathname + url.search)
      if (scrollTargetId) {
        document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth' })
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    },
    [scrollTargetId],
  )

  return { data, loading, page, setPage }
}
