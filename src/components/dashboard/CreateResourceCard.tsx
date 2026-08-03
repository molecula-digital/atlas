import Link from 'next/link'
import { Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CreateResourceCardProps = {
  href: string
  title: string
  description: string
  icon?: LucideIcon
  className?: string
}

/** Clickable dashed card that replaces primary "add new" buttons in dashboard lists. */
export function CreateResourceCard({
  href,
  title,
  description,
  icon: Icon = Plus,
  className,
}: CreateResourceCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-start gap-3 rounded-lg border border-dashed border-border bg-card/40 p-4 transition-colors',
        'hover:border-accent/50 hover:bg-accent/5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-accent/40',
        className,
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-dashed border-border bg-elevated text-muted transition-colors group-hover:border-accent/40 group-hover:text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-primary group-hover:text-accent transition-colors">
          {title}
        </h3>
        <p className="mt-0.5 text-2xs text-muted font-mono leading-relaxed">
          {description}
        </p>
      </div>
      <Plus className="mt-1 h-4 w-4 shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100 group-hover:text-accent" />
    </Link>
  )
}
