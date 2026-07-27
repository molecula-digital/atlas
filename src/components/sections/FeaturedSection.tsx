import Link from 'next/link'
import { EntryStrip } from '@/components/entries/EntryStrip'
import { type AtlasEntryType } from '@/config'
import { SectionTitle } from '@/components/ui/SectionTitle'

interface FeaturedEntry {
  slug: string
  name: string
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
}

interface FeaturedSectionProps {
  entries: FeaturedEntry[]
  latestEntries: FeaturedEntry[]
}

export function FeaturedSection({ entries, latestEntries }: FeaturedSectionProps) {
  if (entries.length === 0) return null

  const displayEntries = entries.slice(0, 6)
  const displayLatest = latestEntries.slice(0, 4)

  return (
    <section className="py-4">
      <div>
        <div className="mb-6 flex items-center justify-between">
          <SectionTitle description="Startups y organizaciones destacadas del ecosistema">
            Destacados
          </SectionTitle>
          <Link
            href="/directorio"
            className="hidden items-center gap-2 text-sm font-mono text-accent hover:underline sm:inline-flex"
          >
            Ver todos
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        </div>

        <div className="rounded-xl border-2 border-accent/25 bg-card/50 p-4 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:gap-8">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {displayEntries.map((entry) => (
                <EntryStrip
                  key={entry.slug}
                  slug={entry.slug}
                  name={entry.name}
                  entryType={entry.entryType}
                  logo={entry.logo}
                />
              ))}
            </div>

            {displayLatest.length > 0 && (
              <div className="flex flex-col gap-3 lg:border-l lg:border-border lg:pl-6 xl:pl-8">
                <h3 className="text-sm font-mono font-semibold uppercase tracking-wide text-muted">
                  Últimos registros
                </h3>
                <div className="flex flex-col gap-3">
                  {displayLatest.map((entry) => (
                    <EntryStrip
                      key={entry.slug}
                      slug={entry.slug}
                      name={entry.name}
                      entryType={entry.entryType}
                      logo={entry.logo}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
