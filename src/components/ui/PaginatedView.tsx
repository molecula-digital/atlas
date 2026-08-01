'use client'

import { type ReactNode } from 'react'
import { SearchX } from 'lucide-react'
import { usePaginatedData } from '@/hooks/usePaginatedData'
import { Pagination } from '@/components/ui/Pagination'
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
