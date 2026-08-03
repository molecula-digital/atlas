import { cn } from '@/lib/utils'

interface SectionHeadingProps {
  children: React.ReactNode
  className?: string
}

export function SectionHeading({ children, className }: SectionHeadingProps) {
  return (
    <p
      className={cn(
        'text-xs font-mono uppercase text-muted mb-4 tracking-wider',
        className,
      )}
    >
      <span
        className="mr-2 font-bold text-accent terminal-glow"
        aria-hidden="true"
      >
        {'>'}
      </span>
      {children}
    </p>
  )
}
