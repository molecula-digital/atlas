import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'

/**
 * Page navigation shared by the client-fetched lists (`PaginatedView`) and the
 * server-rendered gallery. Pass `onPageChange` for in-place paging, or `hrefFor`
 * to render real links so the pages are shareable and crawlable.
 */
interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange?: (page: number) => void
  hrefFor?: (page: number) => string
}

/** First page, last page, and a one-page window around the current page. */
function pageList(currentPage: number, totalPages: number): (number | '...')[] {
  const pages: (number | '...')[] = []

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i)
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...')
    }
  }

  return pages
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  hrefFor,
}: PaginationProps) {
  if (totalPages <= 1) return null

  const surface = 'min-w-7 bg-card/90 backdrop-blur-sm'
  const active = buttonVariants({ variant: 'accent', size: 'md', className: surface })
  const inactive = buttonVariants({ variant: 'neutral', size: 'md', className: surface })
  const disabled = buttonVariants({
    variant: 'neutral',
    size: 'md',
    className: `${surface} text-muted/40 pointer-events-none`,
  })

  const isFirst = currentPage <= 1
  const isLast = currentPage >= totalPages

  /**
   * In link mode this renders no event handlers at all — not even inert ones —
   * because a server component cannot pass a function prop to the client.
   */
  const cell = (
    key: string,
    page: number,
    content: React.ReactNode,
    { isCurrent = false, isDisabled = false, label }: {
      isCurrent?: boolean
      isDisabled?: boolean
      label?: string
    } = {},
  ) => {
    const className = isDisabled ? disabled : isCurrent ? active : inactive

    if (hrefFor) {
      return isCurrent || isDisabled ? (
        <span
          key={key}
          className={className}
          aria-label={label}
          aria-current={isCurrent ? 'page' : undefined}
          aria-disabled={isDisabled || undefined}
        >
          {content}
        </span>
      ) : (
        <Link key={key} href={hrefFor(page)} className={className} aria-label={label}>
          {content}
        </Link>
      )
    }

    return (
      <button
        key={key}
        type="button"
        onClick={() => !isDisabled && onPageChange?.(page)}
        className={className}
        aria-label={label}
        aria-current={isCurrent ? 'page' : undefined}
        disabled={isDisabled}
      >
        {content}
      </button>
    )
  }

  return (
    <nav aria-label="Paginación" className="flex items-center justify-center gap-1 mt-8">
      {cell('prev', currentPage - 1, <ChevronLeft className="w-3.5 h-3.5" />, {
        isDisabled: isFirst,
        label: 'Página anterior',
      })}

      {pageList(currentPage, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-1 text-muted text-sm">
            ...
          </span>
        ) : (
          cell(String(p), p, p, { isCurrent: p === currentPage })
        ),
      )}

      {cell('next', currentPage + 1, <ChevronRight className="w-3.5 h-3.5" />, {
        isDisabled: isLast,
        label: 'Página siguiente',
      })}
    </nav>
  )
}
