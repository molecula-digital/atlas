import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Small mono label used for entry types, tags, and event modality.
 * Tones set their own border color — Tailwind v4's bare `border` would
 * otherwise fall back to currentColor and outline the tinted badges.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1 font-mono text-2xs whitespace-nowrap border',
  {
    variants: {
      tone: {
        accent: 'bg-accent/10 text-accent border-accent/25',
        success: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-transparent',
        info: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-transparent',
        neutral: 'bg-elevated text-muted border-border',
      },
      shape: {
        pill: 'rounded-full px-2 py-0.5',
        square: 'rounded px-1.5 py-0.5',
      },
    },
    defaultVariants: {
      tone: 'accent',
      shape: 'pill',
    },
  },
)

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>

type BadgeProps = React.ComponentPropsWithoutRef<'span'> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, shape, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, shape, className }))} {...props} />
}

export { badgeVariants }
