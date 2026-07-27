import type { LucideIcon } from 'lucide-react'
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb'

interface PageHeroProps {
  /** Leading glyph — takes the place of the terminal `>` on section titles. */
  icon: LucideIcon
  title: React.ReactNode
  description: string
  breadcrumb: BreadcrumbItem[]
}

/**
 * Header shared by the listing routes (eventos, noticias, empleos): breadcrumb,
 * oversized uppercase title with an accent icon, and a mono standfirst.
 * Bottom padding only — top spacing comes from the layout, like every route.
 */
export function PageHero({ icon: Icon, title, description, breadcrumb }: PageHeroProps) {
  return (
    <section className="pb-8">
      <Breadcrumb items={breadcrumb} />

      <div className="space-y-6">
        <h1 className="flex items-start gap-[0.3em] text-4xl md:text-5xl lg:text-hero font-sans font-bold text-primary leading-[1.1] tracking-tight uppercase">
          {/* Sized in em so the icon tracks the title at every breakpoint. */}
          <Icon
            className="icon-glow size-[0.8em] shrink-0 translate-y-[0.14em] text-accent"
            strokeWidth={2.25}
            aria-hidden
          />
          <span>{title}</span>
        </h1>

        <p className="text-sm md:text-base font-mono text-muted leading-relaxed max-w-125">
          {description}
        </p>
      </div>
    </section>
  )
}
