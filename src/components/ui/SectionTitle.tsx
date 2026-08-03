import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SectionTitleProps {
  children: React.ReactNode
  /** Accent glyph shown before the heading, replacing the terminal `>`. */
  icon?: LucideIcon
  /** Optional subtitle rendered under the heading. */
  description?: string
  /** Centers the heading and constrains the description width. */
  align?: 'left' | 'center'
  /** Wrapper classes — use for section spacing. */
  className?: string
  /** Extra classes for the heading itself (e.g. `uppercase`). */
  titleClassName?: string
}

/**
 * Standard section headline (h2 + optional subtitle).
 * For the small mono eyebrow label, use `SectionHeading` instead.
 */
export function SectionTitle({
  children,
  icon: Icon,
  description,
  align = 'left',
  className,
  titleClassName,
}: SectionTitleProps) {
  const centered = align === 'center'

  return (
    <div className={cn(centered && 'text-center', className)}>
      <h2
        className={cn(
          'text-2xl md:text-3xl font-sans font-bold text-primary',
          Icon
            ? cn('flex items-center gap-[0.35em]', centered && 'justify-center')
            : 'terminal-title',
          titleClassName,
        )}
      >
        {Icon && (
          <Icon
            className="icon-glow size-[0.85em] shrink-0 text-accent"
            strokeWidth={2.25}
            aria-hidden
          />
        )}
        {children}
      </h2>
      {description && (
        <p
          className={cn('mt-2 text-secondary', centered && 'max-w-xl mx-auto')}
        >
          {description}
        </p>
      )}
    </div>
  )
}
