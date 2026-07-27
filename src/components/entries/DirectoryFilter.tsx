'use client'

import { useState, useEffect } from 'react'
import {
  LayoutGrid,
  SlidersHorizontal,
  ChevronDown,
  ArrowUpDown,
} from 'lucide-react'
import {
  CATEGORY_URL_MAP,
  ENTRY_TYPE_LABELS,
  ENTRY_TYPE_ICONS,
  type AtlasEntryType,
} from '@/config'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { PaginatedView } from '@/components/ui/PaginatedView'
import { EntryCardSkeleton } from './EntryCardSkeleton'
import type { Entry, Media } from '@/payload-types'
import { EntryCard } from './EntryCard'
import { btn } from '@/components/ui/button-styles'

/* ── Types ── */

interface CountsData {
  byCity: Record<string, number>
  byType: Record<string, number>
  total: number
}

interface CityInfo {
  id: string
  name: string
  count: number
}

type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'

const DEFAULT_SORT: SortOption = 'date-desc'

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'name-asc', label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' },
]

interface Props {
  cities: CityInfo[]
  initialType?: string
  initialCity?: string
  pageSize?: number
}

/* ── Helpers ── */

function typeToPath(type: string): string {
  const slug = CATEGORY_URL_MAP[type as AtlasEntryType]
  return slug ? `/${slug}` : '/directorio'
}

function getSortFromURL(): SortOption {
  if (typeof window === 'undefined') return DEFAULT_SORT
  const s = new URLSearchParams(window.location.search).get('sort')
  return SORT_OPTIONS.some((o) => o.value === s) ? (s as SortOption) : DEFAULT_SORT
}

function renderEntryItem(entry: Entry & { kind?: string; href?: string; userId?: string }) {
  const logo = typeof entry.logo === 'object' && entry.logo !== null ? entry.logo as Media : null
  const coverImage = typeof entry.coverImage === 'object' && entry.coverImage !== null ? entry.coverImage as Media : null
  const isUserProfile = entry.kind === 'user-profile'

  return (
    <div className="entry-item animate-in h-full">
      <EntryCard
        slug={entry.slug}
        name={entry.name}
        tagline={entry.tagline ?? undefined}
        entryType={entry.entryType}
        logo={logo && logo.url ? { url: logo.url, alt: logo.alt ?? undefined } : null}
        coverImage={coverImage && coverImage.url ? { url: coverImage.url, alt: coverImage.alt ?? undefined } : null}
        city={entry.city}
        tags={entry.tags ?? undefined}
        href={isUserProfile ? entry.href : undefined}
        hideCity={isUserProfile}
      />
    </div>
  )
}

/* ── DirectoryFilter ── */

export default function DirectoryFilter({
  cities,
  initialType = '',
  initialCity = '',
  pageSize = 18,
}: Props) {
  const [currentSort, setCurrentSort] = useState<SortOption>(DEFAULT_SORT)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({})

  const activeType = initialType
  const activeCity = initialCity

  useEffect(() => {
    setCurrentSort(getSortFromURL())
  }, [])

  useEffect(() => {
    fetch('/api/directory/entries/counts')
      .then((res) => res.json())
      .then((data: CountsData) => setCityCounts(data.byCity))
      .catch(console.error)
  }, [])

  function navigate(type: string, city: string) {
    if (type) {
      window.location.href = typeToPath(type)
    } else if (city) {
      window.location.href = `/directorio/${city}`
    } else {
      window.location.href = '/directorio'
    }
  }

  function handleTypeClick(type: string) {
    navigate(type === activeType ? '' : type, '')
  }

  function handleCityClick(id: string) {
    navigate('', id === activeCity ? '' : id)
  }

  function clearFilters() {
    navigate('', '')
  }

  function handleSortChange(sort: SortOption) {
    setCurrentSort(sort)
    const url = new URL(window.location.href)
    url.searchParams.delete('page')
    if (sort === DEFAULT_SORT) url.searchParams.delete('sort')
    else url.searchParams.set('sort', sort)
    window.history.pushState({}, '', url.pathname + url.search)
  }

  const activeCityName = cities.find((m) => m.id === activeCity)?.name
  const activeTypeName = activeType ? ENTRY_TYPE_LABELS[activeType] : undefined
  const heading = activeCityName || activeTypeName || 'Ecosistema Sinaloa'

  const sortedCities = cities
    .map((c) => ({ ...c, count: cityCounts[c.id] ?? c.count }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count)

  // Build API params
  const apiParams: Record<string, string> = { sort: currentSort }
  if (activeType) apiParams.entryType = activeType
  if (activeCity) apiParams.city = activeCity

  /* ── Shared sidebar content ── */
  const sidebarContent = (
    <>
      {/* Category filters */}
      <div>
        <h3 className="font-mono text-xs text-muted uppercase tracking-wider mb-3">Categorías</h3>
        <div className="space-y-1">
          <a
            href="/directorio"
            onClick={(e) => {
              e.preventDefault()
              clearFilters()
            }}
            className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-colors ${
              !activeType && !activeCity
                ? 'bg-accent/10 border-l-2 border-accent'
                : 'hover:bg-elevated'
            }`}
          >
            <LayoutGrid
              className={`w-4 h-4 shrink-0 ${
                !activeType && !activeCity ? 'text-accent' : 'text-muted'
              }`}
            />
            <span
              className={`text-sm ${
                !activeType && !activeCity ? 'text-accent font-medium' : 'text-primary'
              }`}
            >
              Todos
            </span>
          </a>

          {Object.entries(ENTRY_TYPE_LABELS).map(([type, label]) => {
            const IconComponent = ENTRY_TYPE_ICON_MAP[ENTRY_TYPE_ICONS[type]] || LayoutGrid
            const isActive = activeType === type
            return (
              <a
                key={type}
                href={typeToPath(type)}
                onClick={(e) => {
                  e.preventDefault()
                  handleTypeClick(type)
                }}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-colors ${
                  isActive ? 'bg-accent/10 border-l-2 border-accent' : 'hover:bg-elevated'
                }`}
              >
                <IconComponent
                  className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent' : 'text-muted'}`}
                />
                <span
                  className={`text-sm ${isActive ? 'text-accent font-medium' : 'text-primary'}`}
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
        <h3 className="font-mono text-xs text-muted uppercase tracking-wider mb-3">Municipios</h3>
        <div className="space-y-1">
          {sortedCities.map((mun) => (
            <button
              key={mun.id}
              onClick={() => handleCityClick(mun.id)}
              className={`w-full flex items-center justify-between py-2 px-3 rounded text-left transition-colors cursor-pointer ${
                activeCity === mun.id
                  ? 'bg-accent/10 border-l-2 border-accent'
                  : 'hover:bg-elevated'
              }`}
            >
              <span
                className={`text-sm ${
                  activeCity === mun.id ? 'text-accent font-medium' : 'text-primary'
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
        <h3 className="font-mono text-xs text-muted uppercase tracking-wider mb-3">Ordenar</h3>
        <div className="space-y-1">
          {SORT_OPTIONS.map((opt) => {
            const isActive = currentSort === opt.value
            return (
              <button
                key={opt.value}
                onClick={() => handleSortChange(opt.value)}
                className={`w-full flex items-center gap-2.5 py-2 px-3 rounded text-left transition-colors cursor-pointer ${
                  isActive ? 'bg-accent/10 border-l-2 border-accent' : 'hover:bg-elevated'
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
      <h1 className="terminal-title text-3xl md:text-4xl font-sans font-bold text-primary">{heading}</h1>
      <p className="mt-2 text-secondary mb-6">
        Explora el directorio del ecosistema tech.
      </p>

      {/* Mobile filter panel */}
      <div className="lg:hidden mb-6">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className={btn({ size: "md" }, "w-full justify-between backdrop-blur-sm")}
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-muted" />
            Filtros
            {(activeType || activeCity) && (
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-accent/20 text-accent">1</span>
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
            <div className="mt-2 bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 space-y-4">
              {sidebarContent}
            </div>
          </div>
        </div>
      </div>

      {/* Desktop: sidebar + content grid */}
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block bg-card/90 backdrop-blur-sm border border-border rounded-lg p-4 h-fit lg:max-h-[calc(100vh-12rem)] lg:overflow-y-auto space-y-4">
          {sidebarContent}
        </aside>

        {/* Content area */}
        <PaginatedView<Entry>
          endpoint="/api/directory/entries"
          params={apiParams}
          renderItem={renderEntryItem}
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
