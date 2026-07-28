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
 * uppercase title with an accent icon centered against it, and a mono standfirst.
 * Bottom padding only — top spacing comes from the layout, like every route.
 */
export function PageHero({ icon: Icon, title, description, breadcrumb }: PageHeroProps) {
  return (
    <section className="pb-8">
      <Breadcrumb items={breadcrumb} />

      <div className="space-y-5">
        <h1 className="flex items-center gap-[0.3em] text-3xl md:text-4xl lg:text-5xl font-sans font-bold text-primary leading-[1.1] tracking-tight uppercase">
          {/* Sized in em so the icon tracks the title at every breakpoint. */}
          <Icon
            className="icon-glow size-[0.8em] shrink-0 text-accent"
            strokeWidth={2.25}
            aria-hidden
          />
          <span>{title}</span>
        </h1>

        <p className="text-sm md:text-base font-mono text-muted leading-relaxed max-w-180">
          {description}
        </p>
      </div>
    </section>
  )
}
