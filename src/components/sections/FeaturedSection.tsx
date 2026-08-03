import { SectionBlock } from '@/components/layout/SectionBlock'
import { EntryStrip } from '@/components/entries/EntryStrip'
import { FeaturedEntryTile } from '@/components/entries/FeaturedEntryTile'
import FeaturedCarousel from '@/components/entries/FeaturedCarousel'
import { DirectoryCtaLink } from '@/components/entries/DirectoryCtaLink'
import { type AtlasEntryType } from '@/config'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { DIRECTORY_CTA, ENTRY_SURFACE } from '@/lib/analytics-events'

interface FeaturedEntry {
  slug: string
  name: string
  tagline?: string | null
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
  coverImage?: { url: string; alt?: string } | null
  city: string
}

interface FeaturedSectionProps {
  entries: FeaturedEntry[]
  latestEntries: FeaturedEntry[]
}

export function FeaturedSection({
  entries,
  latestEntries,
}: FeaturedSectionProps) {
  if (entries.length === 0) return null

  const displayEntries = entries.slice(0, 6)
  // Five fills the xl sidebar next to two rows of tiles; the fifth is dropped when the
  // list sits below the tiles as a 2-up grid and four is the even number.
  const displayLatest = latestEntries.slice(0, 5)

  return (
    <SectionBlock>
      <div className="min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <SectionTitle description="Startups y organizaciones destacadas del ecosistema">
            Destacados
          </SectionTitle>
          <DirectoryCtaLink
            cta={DIRECTORY_CTA.featuredHeader}
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
          </DirectoryCtaLink>
        </div>

        <div className="overflow-hidden rounded-xl border-2 border-accent/25 bg-card/50 p-4 shadow-sm sm:p-6">
          <div className="flex min-w-0 flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] xl:items-stretch xl:gap-8">
            <div className="min-w-0">
              {/* Scroller up to lg — six stacked tiles turned the panel into a tower on phones */}
              <div className="lg:hidden">
                <FeaturedCarousel
                  entries={displayEntries}
                  surface={ENTRY_SURFACE.homeFeatured}
                />
              </div>

              {/* Three across from lg up, so the six tiles always land in two rows and the
                  sidebar never has a three-row column to stretch against */}
              <div className="hidden min-w-0 gap-3 lg:grid lg:grid-cols-3">
                {displayEntries.map((entry) => (
                  <FeaturedEntryTile
                    key={entry.slug}
                    slug={entry.slug}
                    name={entry.name}
                    tagline={entry.tagline}
                    entryType={entry.entryType}
                    logo={entry.logo}
                    coverImage={entry.coverImage}
                    city={entry.city}
                    surface={ENTRY_SURFACE.homeFeatured}
                  />
                ))}
              </div>
            </div>

            {displayLatest.length > 0 && (
              <div className="flex min-w-0 flex-col gap-3 xl:border-l xl:border-border xl:pl-8">
                <h3 className="shrink-0 text-sm font-mono font-semibold uppercase tracking-wide text-muted">
                  Últimos registros
                </h3>
                {/* Fixed gap instead of justify-between: spread-to-fill turned any height
                    difference with the tiles into gaping holes between strips */}
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:flex xl:flex-col">
                  {displayLatest.map((entry, index) => (
                    <EntryStrip
                      key={entry.slug}
                      slug={entry.slug}
                      name={entry.name}
                      entryType={entry.entryType}
                      logo={entry.logo}
                      tagline={entry.tagline}
                      city={entry.city}
                      surface={ENTRY_SURFACE.homeLatest}
                      className={index >= 4 ? 'hidden xl:flex' : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}
