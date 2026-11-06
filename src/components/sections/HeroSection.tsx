import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { ENTRY_TYPES, ENTRY_TYPE_CONFIG, SINALOA_CITIES } from '@/config'
import type { AtlasEntryType } from '@/config'
import SinaloaMap from '@/components/maps/SinaloaMapLazy'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { DirectoryCtaLink } from '@/components/entries/DirectoryCtaLink'
import { WhatsAppDialog } from '@/components/community/WhatsAppDialog'
import { DIRECTORY_CTA, WHATSAPP_SURFACE } from '@/lib/analytics-events'

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
    <section id="hero" className="pt-8 pb-2 lg:pt-14">
      <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:gap-12">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            Directorio y comunidad
          </p>
          <h1 className="mt-3 max-w-xl font-sans text-4xl font-bold leading-[0.98] tracking-tight text-primary sm:text-5xl lg:text-6xl">
            El directorio tech de <span className="text-accent">Sinaloa</span>
          </h1>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-secondary md:text-base">
            Startups, consultoras, comunidades y personas del estado. También el
            grupo donde se habla de tecnología, IA y software.
          </p>
          <div className="mt-6 flex flex-col items-start gap-3">
            <WhatsAppDialog
              surface={WHATSAPP_SURFACE.hero}
              label="Grupo de WhatsApp"
              size="lg"
              className="px-4 py-2.5"
            />
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs">
              <DirectoryCtaLink
                cta={DIRECTORY_CTA.hero}
                className="inline-flex items-center gap-1 text-accent hover:underline"
              >
                Ver el directorio completo
                <ArrowRight className="size-3.5" />
              </DirectoryCtaLink>
              <Link
                href="/dashboard"
                className="text-secondary hover:text-primary"
              >
                Agregar un perfil
              </Link>
            </div>
          </div>
        </div>

        <div className="relative h-80 overflow-hidden rounded-2xl border border-border bg-card/70 sm:h-96 lg:h-[32rem]">
          <SinaloaMap
            compact
            linkOnClick
            dither
            pulseActive
            cityCounts={cityCounts}
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-card via-card/80 to-transparent px-4 pt-14 pb-3">
            <span className="font-sans text-sm font-semibold text-primary">
              Sinaloa
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
              {SINALOA_CITIES.length} municipios
            </span>
          </div>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {ecosystemStats.map(
          ({ type, label, description, slug, Icon, count }) => (
            <Link
              key={type}
              href={`/${slug}`}
              className="group flex items-start justify-between gap-4 bg-card px-4 py-4 transition-colors hover:bg-elevated"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-sans text-base font-semibold text-primary group-hover:text-accent">
                  {Icon && <Icon className="size-4 shrink-0 text-accent" />}
                  {label}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {description}
                </span>
              </span>
              <span className="shrink-0 font-mono text-sm tabular-nums text-secondary">
                {count}
              </span>
            </Link>
          ),
        )}
      </div>
    </section>
  )
}
