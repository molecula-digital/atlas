import { cn } from '@/lib/utils'

type CardProps = React.HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'article' | 'aside'
}

/** Content surface chrome. Callers override padding via className. */
export function Card({ as: Component = 'div', className, ...props }: CardProps) {
  return (
    <Component
      className={cn('bg-card/90 backdrop-blur-sm border border-border rounded-lg p-6', className)}
      {...props}
    />
  )
}
