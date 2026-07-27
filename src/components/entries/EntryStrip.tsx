import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { EntryBadge } from '@/components/entries/EntryBadge'
import { getEntryUrl, type AtlasEntryType } from '@/config'

export interface EntryStripProps {
  slug: string
  name: string
  entryType: AtlasEntryType
  logo?: { url: string; alt?: string } | null
  href?: string
}

export function EntryStrip({
  slug,
  name,
  entryType,
  logo,
  href: hrefOverride,
}: EntryStripProps) {
  const href = hrefOverride ?? getEntryUrl(entryType, slug)
  const logoUrl = typeof logo === 'object' && logo?.url ? logo.url : null

  return (
    <Link
      href={href}
      className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left transition-all duration-200 hover:border-[var(--color-accent)]/40 hover:shadow-sm"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-accent/20 bg-accent/10">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={logo?.alt ?? `${name} logo`}
            width={40}
            height={40}
            className="h-10 w-10 object-contain"
          />
        ) : (
          <span className="text-base font-sans font-bold text-accent">
            {name.charAt(0)}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-sans font-semibold text-primary transition-colors group-hover:text-accent">
            {name}
          </span>
          <span className="shrink-0">
            <EntryBadge entryType={entryType} />
          </span>
        </div>
      </div>

      <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-colors group-hover:text-accent" />
    </Link>
  )
}
