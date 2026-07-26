import { cn } from '@/lib/utils'

/**
 * Shared button styling — outline only, matching the header's compact look.
 * No button in the app should carry a solid background; emphasis comes from
 * the border/text color and a subtle tint on hover.
 */

export type BtnVariant = 'accent' | 'neutral' | 'ghost' | 'danger'
export type BtnSize = 'xs' | 'sm' | 'md' | 'lg'

const BTN_BASE =
  'inline-flex items-center justify-center gap-1.5 rounded border bg-transparent font-mono font-semibold whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none'

const BTN_VARIANTS: Record<BtnVariant, string> = {
  accent: 'border-accent/60 text-accent hover:border-accent hover:bg-accent/10',
  neutral: 'border-border text-primary hover:border-accent/50 hover:text-accent',
  ghost: 'border-transparent text-secondary hover:text-accent hover:border-border',
  danger: 'border-red-500/40 text-red-500 hover:border-red-500/70 hover:bg-red-500/10',
}

const BTN_SIZES: Record<BtnSize, string> = {
  xs: 'gap-1 px-1.5 py-0.5 text-[10px]',
  sm: 'px-2 py-1 text-[11px]',
  md: 'px-2.5 py-1.5 text-xs',
  lg: 'px-3 py-1.5 text-sm',
}

/** Square icon-only buttons, sized to match the text variants. */
const BTN_ICON_SIZES: Record<BtnSize, string> = {
  xs: 'w-5 h-5 p-0',
  sm: 'w-6 h-6 p-0',
  md: 'w-7 h-7 p-0',
  lg: 'w-8 h-8 p-0',
}

interface BtnOptions {
  variant?: BtnVariant
  size?: BtnSize
  /** Render as a square icon-only button. */
  icon?: boolean
}

export function btn(
  { variant = 'neutral', size = 'sm', icon = false }: BtnOptions = {},
  className?: string,
) {
  return cn(
    BTN_BASE,
    BTN_VARIANTS[variant],
    icon ? BTN_ICON_SIZES[size] : BTN_SIZES[size],
    className,
  )
}
