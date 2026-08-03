import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  subtitle?: string
  action?: ReactNode
  className?: string
}

/**
 * The one "nothing here" state: a large, faint glyph over mono copy.
 * Listings use it bare; the dashboard adds a subtitle and an action.
 */
export function EmptyState({
  icon: Icon,
  title,
  subtitle,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-20', className)}>
      <Icon
        className="w-12 h-12 mx-auto mb-4 text-muted opacity-40"
        strokeWidth={1.5}
        aria-hidden
      />
      <p className="text-muted font-mono text-sm">{title}</p>
      {subtitle && (
        <p className="mt-1.5 text-xs text-muted/70 font-mono">{subtitle}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
