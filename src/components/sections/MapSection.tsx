'use client'

import { SectionBlock } from '@/components/layout/SectionBlock'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { SINALOA_CITIES, emptyTypeCounts } from '@/config'
import type { AtlasEntryType } from '@/config'
import { SectionTitle } from '@/components/ui/SectionTitle'
import CityList from '@/components/maps/CityList'
import CityStats from '@/components/maps/CityStats'
import { MapPin, Globe } from 'lucide-react'

const SinaloaMap = dynamic(() => import('@/components/maps/SinaloaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-elevated animate-pulse rounded-lg" />
  ),
})

type TypeCounts = Record<AtlasEntryType, number>

interface MapSectionProps {
  cityCounts: Record<string, number>
  cityTypeCounts: Record<string, TypeCounts>
}

const EMPTY_TYPE_COUNTS: TypeCounts = emptyTypeCounts()

export default function MapSection({
  cityCounts,
  cityTypeCounts,
}: MapSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Selected city data
  const selectedData = useMemo(() => {
    if (!selectedId) return null
    const mun = SINALOA_CITIES.find((m) => m.id === selectedId)
    if (!mun) return null
    const stats = cityTypeCounts[selectedId] || {
      ...EMPTY_TYPE_COUNTS,
    }
    const total = Object.values(stats).reduce((a, b) => a + b, 0)
    return { name: mun.name, id: selectedId, stats, total }
  }, [selectedId, cityTypeCounts])

  const handleCityClick = useCallback((id: string) => {
    setSelectedId((prev) => (prev === id ? null : id))
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedId(null)
  }, [])

  // Clear on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (
        !target.closest('[data-city]') &&
        !target.closest('[data-stats-panel]') &&
        !target.closest('[data-map-popup]') &&
        !target.closest('[data-mun-search]')
      ) {
        setSelectedId(null)
      }
    }
    window.addEventListener('click', handler)
    return () => window.removeEventListener('click', handler)
  }, [])

  // Municipalities that actually have entries — counting keys alone would also
  // count any city that happened to be present with a zero count.
  const activeCityCount = Object.values(cityCounts).filter((n) => n > 0).length

  return (
    <SectionBlock id="map">
      <div>
        <div className="mb-6">
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
            atlas://mapa/datos
          </p>
          <SectionTitle>El ecosistema, municipio por municipio</SectionTitle>
        </div>

        <div className="grid items-center gap-4 lg:grid-cols-9">
          {/* Left: Cities (4 cols) — vertically centered against the map */}
          <div className="space-y-4 lg:col-span-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-accent" />
                <h3 className="font-mono text-sm font-bold uppercase text-primary">
                  <span
                    className="text-accent terminal-glow"
                    aria-hidden="true"
                  >
                    {'>'}
                  </span>{' '}
                  Selecciona municipio
                </h3>
              </div>
              <p className="pl-7 text-sm text-secondary">
                Selecciona un municipio para ver su ecosistema tech
              </p>
            </div>

            <CityStats selectedData={selectedData} onClose={clearSelection} />

            <CityList
              cities={SINALOA_CITIES}
              cityCounts={cityCounts}
              selectedCity={selectedId}
              onSelectCity={handleCityClick}
            />
          </div>

          {/* Right: Map (5 cols) */}
          <div className="flex lg:col-span-5">
            <div className="flex w-full flex-col rounded-lg border border-border bg-card p-5">
              <div className="mb-4">
                <div className="mb-0.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-accent" />
                    <h3 className="font-mono text-sm font-bold uppercase text-primary">
                      <span className="text-accent terminal-glow">{'>'}</span>{' '}
                      Sinaloa.geo
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
                    <span className="font-mono text-xs text-accent">
                      {activeCityCount}/{SINALOA_CITIES.length} municipios
                    </span>
                  </div>
                </div>
                <p className="pl-7 text-sm text-secondary">
                  Distribución del talento tech en Sinaloa
                </p>
              </div>
              <div className="min-h-100 flex-1 overflow-hidden rounded-lg border border-border bg-elevated">
                <SinaloaMap cityCounts={cityCounts} selectedCity={selectedId} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}
