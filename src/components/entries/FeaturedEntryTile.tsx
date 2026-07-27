import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { EntryBadge } from '@/components/entries/EntryBadge'
import { getEntryUrl, getCityName, type AtlasEntryType } from '@/config'

export interface FeaturedEntryTileProps {
  slug: string
  name: string
  tagline?: string | null
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
  coverImage?: { url: string; alt?: string } | null
  city: string
}

export function FeaturedEntryTile({
  slug,
  name,
  tagline,
  entryType,
  logo,
  coverImage,
  city,
}: FeaturedEntryTileProps) {
  const href = getEntryUrl(entryType, slug)
  const coverUrl = typeof coverImage === 'object' && coverImage?.url ? coverImage.url : null
  const logoUrl = typeof logo === 'object' && logo?.url ? logo.url : null

  return (
    <Link
      href={href}
      className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-accent/40"
    >
      <div className="relative h-24 shrink-0 overflow-hidden bg-elevated">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
          />
        ) : logoUrl ? (
          <div className="relative flex h-full items-center justify-center overflow-hidden p-4">
            <Image
              src={logoUrl}
              alt=""
              aria-hidden="true"
              width={64}
              height={64}
              className="absolute inset-0 h-full w-full scale-150 object-cover opacity-70 blur-2xl saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-card/20 via-transparent to-card/60" />
            <Image
              src={logoUrl}
              alt={name}
              width={56}
              height={56}
              className="relative max-h-14 max-w-[70%] object-contain drop-shadow-md"
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-accent/25 via-elevated to-card text-3xl font-mono font-bold text-accent">
            {name.charAt(0)}
          </div>
        )}
        {coverUrl && logoUrl && (
          <div className="absolute bottom-1.5 right-1.5 rounded-md border border-border bg-card p-0.5">
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
            />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-1 text-sm font-semibold text-primary transition-colors group-hover:text-accent">
          {name}
        </h3>
        {tagline && (
          <p className="line-clamp-2 text-xs text-secondary">{tagline}</p>
        )}
        <div className="mt-auto flex flex-col gap-1.5 pt-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
          <p className="flex min-w-0 items-center gap-1 text-2xs font-mono text-muted">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{getCityName(city)}</span>
          </p>
          <EntryBadge entryType={entryType} className="w-fit shrink-0" />
        </div>
      </div>
    </Link>
  )
}
