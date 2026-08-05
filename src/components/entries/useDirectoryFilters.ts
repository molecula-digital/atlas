'use client'

import { useState, useEffect, useCallback } from 'react'
import posthog from 'posthog-js'
import {
  CATEGORY_URL_MAP,
  ENTRY_TYPE_LABELS,
  SECTOR_OPTIONS,
  isStartupLike,
  type AtlasEntryType,
} from '@/config'
import { ANALYTICS_EVENTS } from '@/lib/analytics-events'

export interface CityInfo {
  id: string
  name: string
  count: number
}

export type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'

export const DEFAULT_SORT: SortOption = 'date-desc'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'name-asc', label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' },
]

const VALID_SECTORS = new Set(SECTOR_OPTIONS.map((o) => o.value))

export function typeToPath(type: string): string {
  const slug = CATEGORY_URL_MAP[type as AtlasEntryType]
  return slug ? `/${slug}` : '/directorio'
}

function getSortFromURL(): SortOption {
  if (typeof window === 'undefined') return DEFAULT_SORT
  const s = new URLSearchParams(window.location.search).get('sort')
  return SORT_OPTIONS.some((o) => o.value === s)
    ? (s as SortOption)
    : DEFAULT_SORT
}

/** Comma-separated `sector` query; values validated against SECTOR_OPTIONS. */
function getSectorsFromURL(): string[] {
  if (typeof window === 'undefined') return []
  const raw = new URLSearchParams(window.location.search).get('sector')
  if (!raw) return []
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter((s) => VALID_SECTORS.has(s))
}

function writeSectorsToURL(sectors: string[]) {
  const url = new URL(window.location.href)
  url.searchParams.delete('page')
  if (sectors.length === 0) url.searchParams.delete('sector')
  else url.searchParams.set('sector', sectors.join(','))
  window.history.pushState({}, '', url.pathname + url.search)
}

/**
 * Filter selection and sort for the directory listing.
 * Category/city live in the path; sort + sector live in the query string.
 */
export function useDirectoryFilters({
  cities,
  activeType,
  activeCity,
}: {
  cities: CityInfo[]
  activeType: string
  activeCity: string
}) {
  const [currentSort, setCurrentSort] = useState<SortOption>(DEFAULT_SORT)
  const [selectedSectors, setSelectedSectors] = useState<string[]>([])
  const [mobileOpen, setMobileOpen] = useState(false)

  // Read after mount: the server render has no window, and seeding from it
  // directly would make the first client render disagree with the HTML.
  useEffect(() => {
    queueMicrotask(() => {
      setCurrentSort(getSortFromURL())
      setSelectedSectors(getSectorsFromURL())
    })
  }, [])

  const showSectorFilter = !activeType || isStartupLike(activeType)

  const navigate = useCallback(
    (type: string, city: string, sectors: string[] = selectedSectors) => {
      const base = type
        ? typeToPath(type)
        : city
          ? `/directorio/${city}`
          : '/directorio'
      const params = new URLSearchParams()
      if (sectors.length > 0) params.set('sector', sectors.join(','))
      const qs = params.toString()
      window.location.href = qs ? `${base}?${qs}` : base
    },
    [selectedSectors],
  )

  const selectType = useCallback(
    (type: string) => {
      const next = type === activeType ? '' : type
      posthog.capture(ANALYTICS_EVENTS.directoryFilterApplied, {
        filter: 'entry_type',
        value: next || null,
        cleared: next === '',
      })
      // Sector only applies to startup-like types — drop it when leaving them.
      const keepSectors = !next || isStartupLike(next) ? selectedSectors : []
      navigate(next, '', keepSectors)
    },
    [navigate, activeType, selectedSectors],
  )

  const selectCity = useCallback(
    (id: string) => {
      const next = id === activeCity ? '' : id
      posthog.capture(ANALYTICS_EVENTS.directoryFilterApplied, {
        filter: 'city',
        value: next || null,
        cleared: next === '',
      })
      navigate('', next)
    },
    [navigate, activeCity],
  )

  const setSectors = useCallback(
    (sectors: string[]) => {
      const prev = new Set(selectedSectors)
      const next = new Set(sectors)
      for (const value of next) {
        if (!prev.has(value)) {
          posthog.capture(ANALYTICS_EVENTS.directoryFilterApplied, {
            filter: 'sector',
            value,
            cleared: false,
          })
        }
      }
      for (const value of prev) {
        if (!next.has(value)) {
          posthog.capture(ANALYTICS_EVENTS.directoryFilterApplied, {
            filter: 'sector',
            value,
            cleared: true,
          })
        }
      }
      setSelectedSectors(sectors)
      writeSectorsToURL(sectors)
    },
    [selectedSectors],
  )

  const clearFilters = useCallback(() => {
    posthog.capture(ANALYTICS_EVENTS.directoryFilterApplied, {
      filter: 'all',
      value: null,
      cleared: true,
    })
    navigate('', '', [])
  }, [navigate])

  const setSort = useCallback((sort: SortOption) => {
    posthog.capture(ANALYTICS_EVENTS.directorySortChanged, { sort })
    setCurrentSort(sort)
    const url = new URL(window.location.href)
    url.searchParams.delete('page')
    if (sort === DEFAULT_SORT) url.searchParams.delete('sort')
    else url.searchParams.set('sort', sort)
    window.history.pushState({}, '', url.pathname + url.search)
  }, [])

  const activeCityName = cities.find((m) => m.id === activeCity)?.name
  const activeTypeName = activeType ? ENTRY_TYPE_LABELS[activeType] : undefined

  const apiParams: Record<string, string> = { sort: currentSort }
  if (activeType) apiParams.entryType = activeType
  if (activeCity) apiParams.city = activeCity
  if (showSectorFilter && selectedSectors.length > 0) {
    apiParams.sector = selectedSectors.join(',')
  }

  const activeFilterCount =
    (activeType || activeCity ? 1 : 0) +
    (showSectorFilter && selectedSectors.length > 0 ? 1 : 0)

  return {
    currentSort,
    setSort,
    mobileOpen,
    setMobileOpen,
    selectedSectors,
    setSectors,
    showSectorFilter,
    activeFilterCount,
    sortedCities: cities
      .filter((m) => m.count > 0)
      .sort((a, b) => b.count - a.count),
    apiParams,
    activeCityName,
    activeTypeName,
    heading: activeCityName || activeTypeName || 'Ecosistema Sinaloa',
    selectType,
    selectCity,
    clearFilters,
  }
}
