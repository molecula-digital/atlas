'use client'

import {
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
  MapPin,
  type LucideIcon,
} from 'lucide-react'
import {
  ENTRY_TYPE_COLORS,
  ENTRY_TYPE_ICONS,
  ENTRY_TYPE_LABELS,
  type AtlasEntryType,
} from '@/config'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Card } from '@/components/ui/Card'
import { PaginatedView } from '@/components/ui/PaginatedView'
import { EntryCardSkeleton } from './EntryCardSkeleton'
import type { Entry, Media } from '@/payload-types'
import { EntryCard } from './EntryCard'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  useDirectoryFilters,
  typeToPath,
  SORT_OPTIONS,
  type CityInfo,
} from './useDirectoryFilters'
import Link from 'next/link'

interface Props {
  cities: CityInfo[]
  initialType?: string
  initialCity?: string
  pageSize?: number
}

/**
 * `hideTypeBadge` is set when the listing is already filtered to a single type —
 * on /personas or /empresas the badge only repeats the page heading.
 */
function renderEntryItem(
  entry: Entry & { kind?: string; href?: string; userId?: string },
  hideTypeBadge: boolean,
) {
  const logo =
    typeof entry.logo === 'object' && entry.logo !== null
      ? (entry.logo as Media)
      : null
  const isUserProfile = entry.kind === 'user-profile'

  return (
    <div className="entry-item animate-in h-full">
      <EntryCard
        slug={entry.slug}
        name={entry.name}
        tagline={entry.tagline ?? undefined}
        entryType={entry.entryType}
        logo={
          logo && logo.url
            ? { url: logo.url, alt: logo.alt ?? undefined }
            : null
        }
        city={entry.city}
        href={isUserProfile ? entry.href : undefined}
        hideCity={isUserProfile}
        hideTypeBadge={hideTypeBadge}
      />
    </div>
  )
}

/* ── DirectoryFilter ── */

function FilterSectionTitle({
  icon: Icon,
  children,
}: {
  icon: LucideIcon
  children: React.ReactNode
}) {
  return (
    <h3 className="mb-3 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted">
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {children}
    </h3>
  )
}

export default function DirectoryFilter({
  cities,
  initialType = '',
  initialCity = '',
  pageSize = 18,
}: Props) {
  const activeType = initialType
  const activeCity = initialCity

  const {
    currentSort,
    setSort,
    mobileOpen,
    setMobileOpen,
    sortedCities,
    apiParams,
    activeCityName,
    activeTypeName,
    heading,
    selectType,
    selectCity,
    clearFilters,
  } = useDirectoryFilters({ cities, activeType, activeCity })

  /* ── Shared sidebar content ── */
  const sidebarContent = (
    <>
      {/* Category filters */}
      <div>
        <FilterSectionTitle icon={LayoutGrid}>Categorías</FilterSectionTitle>
        <div className="space-y-1">
          <Link
            href="/directorio"
            onClick={(e) => {
              e.preventDefault()
              clearFilters()
            }}
            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-colors ${
              !activeType && !activeCity ? 'bg-accent/10' : 'hover:bg-elevated'
            }`}
          >
            <LayoutGrid
              className={`w-4 h-4 shrink-0 ${
                !activeType && !activeCity ? 'text-accent' : 'text-muted'
              }`}
            />
            <span
              className={`text-sm ${
                !activeType && !activeCity
                  ? 'text-accent font-medium'
                  : 'text-primary'
              }`}
            >
              Todos
            </span>
          </Link>

          {Object.entries(ENTRY_TYPE_LABELS).map(([type, label]) => {
            const IconComponent =
              ENTRY_TYPE_ICON_MAP[ENTRY_TYPE_ICONS[type]] || LayoutGrid
            const isActive = activeType === type
            const colors = ENTRY_TYPE_COLORS[type as AtlasEntryType]
            return (
              <a
                key={type}
                href={typeToPath(type)}
                onClick={(e) => {
                  e.preventDefault()
                  selectType(type)
                }}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-colors ${
                  isActive ? colors.activeBg : 'hover:bg-elevated'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${colors.icon}`} />
                <span
                  className={`text-sm ${
                    isActive
                      ? `${colors.activeText} font-medium`
                      : 'text-primary'
                  }`}
                >
                  {label}
                </span>
              </a>
            )
          })}
        </div>
      </div>

      <hr className="border-border" />

      {/* City filters */}
      <div>
        <FilterSectionTitle icon={MapPin}>Municipios</FilterSectionTitle>
        <div className="space-y-1">
          {sortedCities.map((mun) => (
            <button
              key={mun.id}
              onClick={() => selectCity(mun.id)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded text-left transition-colors cursor-pointer ${
                activeCity === mun.id ? 'bg-accent/10' : 'hover:bg-elevated'
              }`}
            >
              <span
                className={`text-sm ${
                  activeCity === mun.id
                    ? 'text-accent font-medium'
                    : 'text-primary'
                }`}
              >
                {mun.name}
              </span>
              <span className="text-xs font-mono text-muted">{mun.count}</span>
            </button>
          ))}
        </div>
      </div>

      <hr className="border-border" />

      {/* Sort options */}
      <div>
        <FilterSectionTitle icon={ArrowUpDown}>Ordenar</FilterSectionTitle>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => {
            const isActive = currentSort === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-colors cursor-pointer ${
                  isActive ? 'bg-accent/10' : 'hover:bg-elevated'
                }`}
              >
                <ArrowUpDown
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`}
                />
                <span
                  className={`text-sm ${isActive ? 'text-accent font-medium' : 'text-primary'}`}
                >
                  {opt.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )

  return (
    <div id="directory-top">
      <Breadcrumb
        items={
          activeCityName || activeTypeName
            ? [
                { label: 'Inicio', href: '/' },
                { label: 'Directorio', onClick: clearFilters },
                { label: activeCityName || activeTypeName || '' },
              ]
            : [{ label: 'Inicio', href: '/' }, { label: 'Directorio' }]
        }
      />

      {/* Heading */}
      <h1 className="terminal-title text-3xl md:text-4xl font-sans font-bold text-primary">
        {heading}
      </h1>
      <p className="mt-2 text-secondary mb-6">
        Explora el directorio del ecosistema tech.
      </p>

      {/* Mobile filter panel */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={buttonVariants({
            size: 'md',
            className: 'w-full justify-between backdrop-blur-sm',
          })}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted" />
            Filtros
            {(activeType || activeCity) && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent/20 text-accent">
                1
              </span>
            )}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted transition-transform duration-250 ${
              mobileOpen ? 'rotate-180' : ''
            }`}
          />
        </button>

        <div className={`collapse-grid ${mobileOpen ? 'open' : ''}`}>
          <div className="collapse-content">
            <Card className="mt-2 p-4 space-y-4">{sidebarContent}</Card>
          </div>
        </div>
      </div>

      {/* Desktop: sidebar + content grid */}
      <div className="grid items-start gap-6 lg:grid-cols-[240px_1fr]">
        {/* Desktop sidebar */}
        <Card
          as="aside"
          className="hidden space-y-4 p-4 lg:sticky lg:top-14 lg:block"
        >
          {sidebarContent}
        </Card>

        {/* Content area */}
        <PaginatedView<Entry>
          endpoint="/api/directory/entries"
          params={apiParams}
          renderItem={(entry) => renderEntryItem(entry, Boolean(activeType))}
          renderSkeleton={() => <EntryCardSkeleton />}
          layout="grid"
          gridCols="grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
          pageSize={pageSize}
          scrollTargetId="directory-top"
        />
      </div>
    </div>
  )
}
