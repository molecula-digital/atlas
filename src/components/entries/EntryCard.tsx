import Link from 'next/link'
import Image from 'next/image'
import { MapPin } from 'lucide-react'
import { EntryBadge } from './EntryBadge'
import { getEntryUrl, getCityName, type AtlasEntryType } from '@/config'
import { toPublicMediaUrl } from '@/lib/media-url'

interface EntryCardProps {
  slug: string
  name: string
  tagline?: string
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
  coverImage?: { url: string; alt?: string } | null
  city: string
  tags?: Array<{ tag: string }> | string[]
  /** Override default directory URL (e.g. user public profiles). */
  href?: string
  /** Hide city row when not applicable. */
  hideCity?: boolean
}

export function EntryCard({
  slug,
  name,
  tagline,
  entryType,
  logo,
  coverImage,
  city,
  tags,
  href: hrefOverride,
  hideCity = false,
}: EntryCardProps) {
  const href = hrefOverride ?? getEntryUrl(entryType, slug)
  const displayTags = (tags || []).slice(0, 3).map((t) => (typeof t === 'string' ? t : t.tag))
  const coverUrl =
    typeof coverImage === 'object' && coverImage?.url
      ? toPublicMediaUrl(coverImage.url)
      : null
  const logoUrl =
    typeof logo === 'object' && logo?.url ? toPublicMediaUrl(logo.url) : null

  return (
    <Link href={href} className="group flex flex-col h-full bg-card/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden hover:border-accent/50 transition-colors">
      <div className="relative h-36 bg-elevated overflow-hidden">
        {coverUrl ? (
          <Image src={coverUrl} alt={name} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw" />
        ) : logoUrl ? (
          /* No cover — wash the backdrop with the logo's own colors */
          <div className="relative flex items-center justify-center h-full p-6 overflow-hidden">
            {/* Same optimized variant as the crisp logo below — the blur hides the low res */}
            <Image
              src={logoUrl}
              alt=""
              aria-hidden="true"
              width={80}
              height={80}
              className="absolute inset-0 h-full w-full object-cover scale-150 blur-2xl opacity-70 saturate-150"
            />
            <div className="absolute inset-0 bg-gradient-to-br from-card/20 via-transparent to-card/60" />
            <Image src={logoUrl} alt={name} width={80} height={80} className="relative max-h-20 max-w-[80%] object-contain drop-shadow-md" />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-accent/25 via-elevated to-card text-accent text-5xl font-mono font-bold">{name.charAt(0)}</div>
        )}
        {coverUrl && logoUrl && (
          <div className="absolute bottom-2 right-2 border border-border rounded-md bg-card p-0.5">
            <Image src={logoUrl} alt={`${name} logo`} width={40} height={40} className="w-10 h-10 object-contain" />
          </div>
        )}
      </div>
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-primary text-sm group-hover:text-accent transition-colors">{name}</h3>
        {tagline && <p className="text-secondary text-sm mt-1 line-clamp-2">{tagline}</p>}
        <div className="flex items-center justify-between gap-2 mt-2">
          {!hideCity ? (
            <p className="text-muted text-2xs font-mono flex items-center gap-1 min-w-0">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{getCityName(city)}</span>
            </p>
          ) : (
            <span />
          )}
          <EntryBadge entryType={entryType} className="shrink-0" />
        </div>
        {displayTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto pt-2">
            {displayTags.map((tag) => <span key={tag} className="text-2xs font-mono px-1.5 py-0.5 rounded bg-elevated text-muted">{tag}</span>)}
          </div>
        )}
      </div>
    </Link>
  )
}
