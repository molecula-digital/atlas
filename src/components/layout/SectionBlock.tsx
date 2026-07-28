import { cn } from '@/lib/utils'

/**
 * A top-level content section, with the one vertical rhythm the home and
 * listing pages share. Sections used to pick their own py-* — four different
 * values across nine sections — which is what this exists to stop.
 *
 * Not for nested blocks: those take their spacing from the parent's flow.
 */
export function SectionBlock({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return <section className={cn('py-6 lg:py-8', className)} {...props} />
}
