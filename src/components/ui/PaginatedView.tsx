'use client'

import { type ReactNode } from 'react'
import { ChevronLeft, ChevronRight, SearchX } from 'lucide-react'
import { usePaginatedData } from '@/hooks/usePaginatedData'
import { buttonVariants } from '@/components/ui/button-variants'
import { EmptyState } from '@/components/ui/EmptyState'

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
  const { data, loading, setPage } = usePaginatedData<T>({
    endpoint,
    params,
    pageSize,
    scrollTargetId,
  })

  const effectiveSkeletonCount = skeletonCount ?? pageSize

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
    return <EmptyState icon={SearchX} title={emptyMessage} />
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
        onPageChange={setPage}
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

  const surface = 'min-w-7 bg-card/90 backdrop-blur-sm'
  const active = buttonVariants({ variant: 'accent', size: 'md', className: surface })
  const inactive = buttonVariants({ variant: 'neutral', size: 'md', className: surface })
  const disabled = buttonVariants({
    variant: 'neutral',
    size: 'md',
    className: `${surface} text-muted/40 pointer-events-none`,
  })

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
