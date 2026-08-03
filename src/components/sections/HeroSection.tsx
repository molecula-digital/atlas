import Link from 'next/link'
import { Search, Plus, MessageCircle, ArrowUpRight, Mail } from 'lucide-react'
import { SINALOA_CITIES, ENTRY_TYPES, ENTRY_TYPE_CONFIG } from '@/config'
import type { AtlasEntryType } from '@/config'
import SinaloaMap from '@/components/maps/SinaloaMapLazy'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip'
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup'
import { DirectoryCtaLink } from '@/components/entries/DirectoryCtaLink'
import { WhatsAppJoinLink } from '@/components/community/WhatsAppJoinLink'
import { DIRECTORY_CTA, WHATSAPP_SURFACE } from '@/lib/analytics-events'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'

interface HeroSectionProps {
  cityCounts?: Record<string, number>
  typeCounts?: Record<string, number>
}

export function HeroSection({
  cityCounts = {},
  typeCounts = {},
}: HeroSectionProps) {
  const ecosystemStats = ENTRY_TYPES.map((type: AtlasEntryType) => ({
    type,
    label: ENTRY_TYPE_CONFIG[type].labelPlural,
    description: ENTRY_TYPE_CONFIG[type].description,
    slug: ENTRY_TYPE_CONFIG[type].slug,
    Icon: ENTRY_TYPE_ICON_MAP[ENTRY_TYPE_CONFIG[type].icon],
    count: typeCounts[type] || 0,
  }))

  return (
    <section id="hero" className="py-6 lg:py-8">
      <div className="grid gap-8 lg:min-h-[34rem] lg:grid-cols-[minmax(0,1fr)_28rem] lg:gap-12 xl:grid-cols-[minmax(0,1fr)_31rem]">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <div className="mt-14 space-y-6 lg:mt-auto">
            <WhatsAppJoinLink
              surface={WHATSAPP_SURFACE.hero}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 hover:bg-accent/20 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-mono font-semibold text-accent tracking-wide">
                {'// ÚNETE EN WHATSAPP'}
              </span>
              <ArrowUpRight className="w-3.5 h-3.5 text-accent" />
            </WhatsAppJoinLink>

            <h1 className="text-3xl font-sans font-bold text-primary leading-[1] tracking-[-0.04em] uppercase sm:text-4xl lg:text-[2.65rem]">
              <span className="block">Descubre el</span>
              <span className="block text-accent terminal-glow">
                ecosistema tech
              </span>
              <span className="block">
                de Sinaloa
                <span className="text-accent" aria-hidden="true">
                  _
                </span>
              </span>
            </h1>

            <p className="text-xs md:text-sm font-mono text-muted leading-relaxed max-w-110">
              Directorio y comunidad del ecosistema tech de Sinaloa. Hablamos de
              tecnología, IA, desarrollo de software y emprendimiento.
            </p>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <DirectoryCtaLink
                cta={DIRECTORY_CTA.hero}
                className={buttonVariants({
                  variant: 'accent-filled',
                  size: 'md',
                  className: 'uppercase',
                })}
              >
                <Search className="w-3.5 h-3.5" />
                Explorar directorio
              </DirectoryCtaLink>
              <Link
                href="/dashboard"
                className={buttonVariants({
                  size: 'md',
                  className: 'uppercase',
                })}
              >
                <Plus className="w-3.5 h-3.5" />
                Crear perfil
              </Link>
            </div>

            <div className="flex flex-col items-center gap-3 text-center lg:flex-row lg:justify-start lg:text-left">
              <Dialog>
                <DialogTrigger asChild>
                  <button className="group inline-flex cursor-pointer items-center gap-2 text-xs text-muted transition-colors hover:text-accent">
                    <Mail className="h-4 w-4 shrink-0 text-accent" />
                    Newsletter — novedades una vez al mes
                    <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </button>
                </DialogTrigger>
                <DialogContent showCloseButton>
                  <DialogHeader>
                    <DialogTitle>Newsletter de Tech Atlas</DialogTitle>
                    <DialogDescription>
                      Noticias, eventos y proyectos del ecosistema tech de
                      Sinaloa. Un correo al mes.
                    </DialogDescription>
                  </DialogHeader>
                  <NewsletterSignup source="homepage" variant="section" />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="hidden lg:block self-start pt-12">
          <div className="bg-card/40 border border-border rounded-lg p-3 flex flex-col gap-3 h-[31rem] shadow-[0_16px_50px_rgba(0,0,0,0.08)]">
            {/* Map header */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-medium text-muted tracking-wide">
                {'// SINALOA.GEO'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-xs font-mono font-semibold text-accent">
                  [{SINALOA_CITIES.length} municipios]
                </span>
              </div>
            </div>

            {/* Map container */}
            <div className="relative flex-1 rounded border border-border bg-elevated/15 overflow-hidden">
              <SinaloaMap
                compact
                linkOnClick
                dither
                pulseActive
                cityCounts={cityCounts}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Ecosystem stats */}
      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-cols-6">
        {ecosystemStats.map(
          ({ type, label, description, slug, Icon, count }) => (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Link
                  href={`/${slug}`}
                  className="group bg-card px-3 py-3 transition-colors hover:bg-elevated"
                >
                  <div className="flex items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent/10 transition-colors group-hover:bg-accent/20">
                      {Icon && <Icon className="h-3.5 w-3.5 text-accent" />}
                    </span>
                    <span className="font-mono text-xl font-bold leading-none text-primary">
                      {count}
                    </span>
                  </div>
                  <p className="mt-2 truncate font-mono text-[10px] uppercase tracking-wider text-muted group-hover:text-accent transition-colors">
                    {label}
                  </p>
                </Link>
              </TooltipTrigger>
              <TooltipContent>{description}</TooltipContent>
            </Tooltip>
          ),
        )}
      </div>
    </section>
  )
}
