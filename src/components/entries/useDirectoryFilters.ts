'use client'

import { useState, useEffect, useCallback } from 'react'
import { CATEGORY_URL_MAP, ENTRY_TYPE_LABELS, type AtlasEntryType } from '@/config'

export interface CityInfo {
  id: string
  name: string
  count: number
}

interface CountsData {
  byCity: Record<string, number>
  byType: Record<string, number>
  total: number
}

export type SortOption = 'name-asc' | 'name-desc' | 'date-desc' | 'date-asc'

export const DEFAULT_SORT: SortOption = 'date-desc'

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'date-desc', label: 'Más recientes' },
  { value: 'date-asc', label: 'Más antiguos' },
  { value: 'name-asc', label: 'Nombre A–Z' },
  { value: 'name-desc', label: 'Nombre Z–A' },
]

export function typeToPath(type: string): string {
  const slug = CATEGORY_URL_MAP[type as AtlasEntryType]
  return slug ? `/${slug}` : '/directorio'
}

function getSortFromURL(): SortOption {
  if (typeof window === 'undefined') return DEFAULT_SORT
  const s = new URLSearchParams(window.location.search).get('sort')
  return SORT_OPTIONS.some((o) => o.value === s) ? (s as SortOption) : DEFAULT_SORT
}

/**
 * Filter selection, sort, and the city counts behind the directory listing.
 * Deliberately specific to this screen — it is not a generic facet system.
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
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cityCounts, setCityCounts] = useState<Record<string, number>>({})

  // Read after mount: the server render has no window, and seeding from it
  // directly would make the first client render disagree with the HTML.
  useEffect(() => {
    setCurrentSort(getSortFromURL())
  }, [])

  useEffect(() => {
    fetch('/api/directory/entries/counts')
      .then((res) => res.json())
      .then((data: CountsData) => setCityCounts(data.byCity))
      .catch(console.error)
  }, [])

  const navigate = useCallback((type: string, city: string) => {
    if (type) {
      window.location.href = typeToPath(type)
    } else if (city) {
      window.location.href = `/directorio/${city}`
    } else {
      window.location.href = '/directorio'
    }
  }, [])

  const selectType = useCallback(
    (type: string) => navigate(type === activeType ? '' : type, ''),
    [navigate, activeType],
  )

  const selectCity = useCallback(
    (id: string) => navigate('', id === activeCity ? '' : id),
    [navigate, activeCity],
  )

  const clearFilters = useCallback(() => navigate('', ''), [navigate])

  const setSort = useCallback((sort: SortOption) => {
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

  return {
    currentSort,
    setSort,
    mobileOpen,
    setMobileOpen,
    sortedCities: cities
      .map((c) => ({ ...c, count: cityCounts[c.id] ?? c.count }))
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
