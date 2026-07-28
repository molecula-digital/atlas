import { cn } from '@/lib/utils'

/**
 * The site's horizontal geometry: gutters on the outside, the content cap on
 * the inside. Header, main, and footer all sit on this frame.
 *
 * The two layers are deliberate — the max-width applies to the content while
 * the gutters sit outside it. Collapsing them onto one element would narrow
 * the content at the cap.
 */
export function SiteFrame({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className="px-4 md:px-6 lg:px-8">
      <div className={cn('mx-auto w-full max-w-280', className)}>{children}</div>
    </div>
  )
}
