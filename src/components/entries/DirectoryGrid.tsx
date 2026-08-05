import type { Entry, Media } from '@/payload-types'
import { EntryCard } from './EntryCard'

interface DirectoryGridProps {
  entries: Entry[]
}

export function DirectoryGrid({ entries }: DirectoryGridProps) {
  return (
    <div id="entries-grid" className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {entries.map((entry) => {
        const logo =
          typeof entry.logo === 'object' && entry.logo !== null
            ? (entry.logo as Media)
            : null

        return (
          <div key={entry.id} className="entry-item animate-in h-full">
            <EntryCard
              slug={entry.slug}
              name={entry.name}
              tagline={entry.tagline ?? undefined}
              entryType={entry.entryType}
              logo={logo && logo.url ? { url: logo.url, alt: logo.alt } : null}
              city={entry.city}
              tags={entry.tags ?? undefined}
            />
          </div>
        )
      })}
    </div>
  )
}
