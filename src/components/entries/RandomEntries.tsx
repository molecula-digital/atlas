'use client'

import { useState, useEffect } from 'react'
import { fetchPaginated } from '@/lib/api'
import { EntryCard } from './EntryCard'
import { EntryCardSkeleton } from './EntryCardSkeleton'
import type { Entry, Media } from '@/payload-types'

export function RandomEntries() {
  const [entries, setEntries] = useState<Entry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPaginated<Entry>('/api/directory/entries', {
      limit: '3',
      sort: 'random',
    })
      .then((res) => setEntries(res.docs))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid sm:grid-cols-3 gap-4">
        {Array.from({ length: 3 }, (_, i) => (
          <EntryCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (entries.length === 0) return null

  return (
    <div className="grid sm:grid-cols-3 gap-4">
      {entries.map((entry) => {
        const logo =
          typeof entry.logo === 'object' && entry.logo !== null
            ? (entry.logo as Media)
            : null

        return (
          <EntryCard
            key={entry.id}
            slug={entry.slug}
            name={entry.name}
            tagline={entry.tagline ?? undefined}
            entryType={entry.entryType}
            logo={logo && logo.url ? { url: logo.url, alt: logo.alt } : null}
            city={entry.city}
          />
        )
      })}
    </div>
  )
}
