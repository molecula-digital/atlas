'use client'

import { useState, useEffect, useCallback, useMemo, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { fetchPaginated, type PaginatedResponse } from '@/lib/api'
import { btn } from '@/components/ui/button-styles'

interface PaginatedViewProps<T> {
  endpoint: string
  params?: Record<string, string>
  renderItem: (item: T) => ReactNode
  renderSkeleton: () => ReactNode
  skeletonCount?: number
  layout?: 'grid' | 'list'
  gridCols?: string
  emptyMessage?: string
  pageSize?: number
  scrollTargetId?: string
}

export function PaginatedView<T extends { id: string | number }>({
  endpoint,
  params,
  renderItem,
  renderSkeleton,
  skeletonCount,
  layout = 'grid',
  gridCols = 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  emptyMessage = 'No se encontraron resultados.',
  pageSize = 18,
  scrollTargetId,
}: PaginatedViewProps<T>) {
  const [data, setData] = useState<PaginatedResponse<T> | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(() => {
    if (typeof window === 'undefined') return 1
    const p = parseInt(new URLSearchParams(window.location.search).get('page') || '1', 10)
    return p > 0 ? p : 1
  })

  const effectiveSkeletonCount = skeletonCount ?? pageSize

  // Stabilize params reference to avoid infinite re-fetch loops
  const paramsKey = useMemo(() => JSON.stringify(params ?? {}), [params])

  const fetchData = useCallback(
    async (page: number) => {
      setLoading(true)
      try {
        const stableParams = JSON.parse(paramsKey) as Record<string, string>
        const result = await fetchPaginated<T>(endpoint, {
          ...stableParams,
          page: String(page),
          limit: String(pageSize),
        })
        setData(result)
      } catch (err) {
        console.error('PaginatedView fetch error:', err)
        setData(null)
      } finally {
        setLoading(false)
      }
    },
    [endpoint, paramsKey, pageSize],
  )

  // Reset to page 1 when params change
  useEffect(() => {
    setCurrentPage(1)
  }, [paramsKey])

  useEffect(() => {
    fetchData(currentPage)
  }, [fetchData, currentPage])

  function handlePageChange(page: number) {
    setCurrentPage(page)
    const url = new URL(window.location.href)
    if (page <= 1) url.searchParams.delete('page')
    else url.searchParams.set('page', String(page))
    window.history.pushState({}, '', url.pathname + url.search)
    if (scrollTargetId) {
      document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Skeleton loading state
  if (loading) {
    const wrapperClass =
      layout === 'grid' ? `grid ${gridCols} gap-4` : 'space-y-4'
    return (
      <div className={wrapperClass}>
        {Array.from({ length: effectiveSkeletonCount }, (_, i) => (
          <div key={i}>{renderSkeleton()}</div>
        ))}
      </div>
    )
  }

  // Empty state
  if (!data || data.docs.length === 0) {
    return (
      <div className="text-center py-20">
        <SearchX className="w-12 h-12 mx-auto mb-4 text-muted opacity-40" strokeWidth={1.5} />
        <p className="text-muted font-mono text-sm">{emptyMessage}</p>
      </div>
    )
  }

  const wrapperClass =
    layout === 'grid' ? `grid ${gridCols} gap-4` : 'space-y-4'

  return (
    <div>
      <div className={wrapperClass}>
        {data.docs.map((item) => (
          <div key={item.id}>{renderItem(item)}</div>
        ))}
      </div>
      <Pagination
        currentPage={data.page}
        totalPages={data.totalPages}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

/* ── Pagination ── */

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  const active = btn({ variant: 'accent', size: 'md' }, 'min-w-7')
  const inactive = btn({ variant: 'ghost', size: 'md' }, 'min-w-7')
  const disabled = btn({ variant: 'ghost', size: 'md' }, 'min-w-7 text-muted/40 pointer-events-none')

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
        className={currentPage <= 1 ? disabled : inactive}
        aria-label="Página anterior"
        disabled={currentPage <= 1}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted text-sm">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={p === currentPage ? active : inactive}
            aria-current={p === currentPage ? 'page' : undefined}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
        className={currentPage >= totalPages ? disabled : inactive}
        aria-label="Página siguiente"
        disabled={currentPage >= totalPages}
      >
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    </nav>
  )
}
