import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { EntryBadge } from '@/components/entries/EntryBadge'
import { getEntryUrl, getCityName, type AtlasEntryType } from '@/config'

export interface EntryStripProps {
  slug: string
  name: string
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
  tagline?: string | null
  city?: string
  href?: string
}

export function EntryStrip({
  slug,
  name,
  entryType,
  logo,
  tagline,
  city,
  href: hrefOverride,
}: EntryStripProps) {
  const href = hrefOverride ?? getEntryUrl(entryType, slug)
  const logoUrl = typeof logo === 'object' && logo?.url ? logo.url : null

  return (
    <Link
      href={href}
      className="group flex w-full min-w-0 items-center gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-all duration-200 hover:border-[var(--color-accent)]/40 hover:shadow-sm"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent/20 bg-accent/10">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={logo?.alt ?? `${name} logo`}
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
        ) : (
          <span className="text-sm font-sans font-bold text-accent">
            {name.charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
          <span className="truncate text-sm font-sans font-semibold text-primary transition-colors group-hover:text-accent">
            {name}
          </span>
          <span className="w-fit shrink-0">
            <EntryBadge entryType={entryType} />
          </span>
        </div>
        {(tagline || city) && (
          <div className="mt-0.5 flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            {tagline && (
              <span className="min-w-0 truncate text-xs font-mono text-muted">
                {tagline}
              </span>
            )}
            {tagline && city && (
              <span className="hidden shrink-0 text-xs text-muted sm:inline">·</span>
            )}
            {city && (
              <span className="inline-flex shrink-0 items-center gap-1 text-2xs font-mono text-muted">
                <MapPin className="h-2.5 w-2.5" />
                {getCityName(city)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
