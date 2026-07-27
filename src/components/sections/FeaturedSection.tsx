import Link from 'next/link'
import { EntryCard } from '@/components/entries/EntryCard'
import FeaturedCarousel from '@/components/entries/FeaturedCarousel'
import { type AtlasEntryType } from '@/config'
import { SectionTitle } from '@/components/ui/SectionTitle'

interface FeaturedEntry {
  slug: string
  name: string
  tagline?: string | null
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
  coverImage?: { url: string; alt?: string } | null
  city: string
  tags?: Array<{ tag: string }> | string[]
}

interface FeaturedSectionProps {
  entries: FeaturedEntry[]
}

export function FeaturedSection({ entries }: FeaturedSectionProps) {
  if (entries.length === 0) return null

  const displayEntries = entries.slice(0, 6)

  return (
    <section className="py-4">
      <div className="max-w-280 mx-auto">
        <div className="flex items-center justify-between mb-10">
          <SectionTitle description="Startups y organizaciones destacadas del ecosistema">
            Destacados
          </SectionTitle>
          <Link
            href="/directorio"
            className="hidden sm:inline-flex items-center gap-2 text-sm font-mono text-accent hover:underline"
          >
            Ver todos
            <svg
              className="w-4 h-4"
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

        {/* Mobile carousel */}
        <div className="sm:hidden">
          <FeaturedCarousel entries={displayEntries} />
        </div>

        {/* Desktop grid */}
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {displayEntries.map((entry) => (
            <EntryCard
              key={entry.slug}
              slug={entry.slug}
              name={entry.name}
              tagline={entry.tagline ?? undefined}
              entryType={entry.entryType}
              logo={entry.logo}
              coverImage={entry.coverImage}
              city={entry.city}
              tags={entry.tags}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
