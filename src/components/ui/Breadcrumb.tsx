import Link from 'next/link'
import { Fragment } from 'react'

interface BreadcrumbItem {
  label: string
  href?: string
  /**
   * Renders the crumb as a button instead of a link — for in-page actions such
   * as clearing directory filters, where there is no URL to navigate to.
   * Ignored when `href` is set.
   */
  onClick?: () => void
}

const CRUMB_INTERACTIVE = 'hover:text-accent transition-colors'

export function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-xs font-mono text-muted mb-6 uppercase">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="mx-2">/</span>}
          {item.href ? (
            <Link href={item.href} className={CRUMB_INTERACTIVE}>
              {item.label}
            </Link>
          ) : item.onClick ? (
            <button type="button" onClick={item.onClick} className={`${CRUMB_INTERACTIVE} cursor-pointer uppercase`}>
              {item.label}
            </button>
          ) : (
            <span className="text-primary">{item.label}</span>
          )}
        </Fragment>
      ))}
    </nav>
  )
}
