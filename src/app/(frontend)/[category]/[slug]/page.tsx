import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getEntryBySlug, getPublishedEntries, getSuggestedEntries } from '@/lib/payload'
import { buildTrackedUrl, flattenArray, safeJsonLd } from '@/lib/utils'
import {
  ENTRY_TYPE_CONFIG,
  ENTRY_TYPE_LABELS,
  URL_CATEGORY_MAP,
  CATEGORY_URL_MAP,
  getCityName,
  SITE_URL,
  type AtlasEntryType,
} from '@/config'
import { extractImageUrl } from '@/lib/format'
import { EntryBadge } from '@/components/entries/EntryBadge'
import { EntryCard } from '@/components/entries/EntryCard'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { Card } from '@/components/ui/Card'
import ShareButton from '@/components/ui/ShareButton'
import { ExternalLink } from '@/components/ui/ExternalLink'
import {
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  Building2,
  Building,
  Clock,
  UserCheck,
  Target,
  LayoutList,
  Link as LinkIcon,
  Briefcase,
  GraduationCap,
  BadgeCheck,
  ExternalLink as ExternalLinkIcon,
  Info,
  Cpu,
  Tag as TagIcon,
} from 'lucide-react'
import Markdown from 'react-markdown'
import type { LucideIcon } from 'lucide-react'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { SocialLinkIcon } from '@/components/icons/SocialIcons'
import { isStartupLike } from '@/config'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'
import { buttonVariants } from '@/components/ui/button-variants'

export async function generateStaticParams() {
  const result = await getPublishedEntries()
  return result.docs.map((entry) => ({
    category: CATEGORY_URL_MAP[entry.entryType as AtlasEntryType],
    slug: entry.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}): Promise<Metadata> {
  const { category, slug } = await params
  const entry = await getEntryBySlug(slug)
  if (!entry) return { title: 'Not Found' }
  const entryType = URL_CATEGORY_MAP[category] as AtlasEntryType | undefined
  const categorySlug = entryType ? ENTRY_TYPE_CONFIG[entryType].slug : category
  const canonical = `${SITE_URL}/${categorySlug}/${entry.slug}`
  const coverUrl = extractImageUrl(entry.coverImage)
  const logoUrl = extractImageUrl(entry.logo)
  const imageUrl = coverUrl || logoUrl || undefined
  return {
    title: entry.name as string,
    description: (entry.tagline as string) || undefined,
    alternates: { canonical },
    openGraph: {
      title: entry.name as string,
      description: (entry.tagline as string) || undefined,
      url: canonical,
      ...(imageUrl ? { images: [{ url: imageUrl }] } : {}),
    },
    twitter: { card: 'summary_large_image' },
  }
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ category: string; slug: string }>
}) {
  const { category, slug } = await params
  const entryType = URL_CATEGORY_MAP[category] as AtlasEntryType | undefined
  if (!entryType) notFound()

  const entry = await getEntryBySlug(slug)
  if (!entry || entry.entryType !== entryType) notFound()

  // Suggestion algorithm: same type > same city > any, max 3
  const suggestions = await getSuggestedEntries(
    String(entry.id),
    entry.entryType as string,
    entry.city as string,
  )

  const config = ENTRY_TYPE_CONFIG[entry.entryType as AtlasEntryType]
  const tags = flattenArray(entry.tags as Array<{ tag: string }>, 'tag')
  const technologies = flattenArray(
    entry.technologies as Array<{ technology: string }>,
    'technology',
  )

  const coverUrl = extractImageUrl(entry.coverImage)
  const logoUrl = extractImageUrl(entry.logo)
  const startupLike = isStartupLike(entry.entryType as string)

  const entryIcon = ENTRY_TYPE_CONFIG[entry.entryType as AtlasEntryType]?.icon
  const EntryIcon = ENTRY_TYPE_ICON_MAP[entryIcon] ?? Target

  /* ---------- Details for sidebar ---------- */
  const details: { label: string; value: string | number | undefined; Icon: LucideIcon; ValueIcon?: LucideIcon }[] = [
    { label: 'Categoria', value: ENTRY_TYPE_LABELS[entry.entryType as string], Icon: TagIcon, ValueIcon: EntryIcon },
    { label: 'Fundada', value: entry.foundedYear as number | undefined, Icon: Calendar },
    { label: 'Equipo', value: entry.teamSize as string | undefined, Icon: Users },
    { label: 'Etapa', value: entry.stage as string | undefined, Icon: TrendingUp },
    { label: 'Sector', value: entry.sector as string | undefined, Icon: Building2 },
    { label: 'Miembros', value: entry.memberCount as number | undefined, Icon: Users },
    { label: 'Frecuencia', value: entry.meetupFrequency as string | undefined, Icon: Clock },
    { label: 'Rol', value: entry.role as string | undefined, Icon: UserCheck },
    { label: 'Empresa', value: entry.company as string | undefined, Icon: Building },
    { label: 'Modelo', value: entry.businessModel as string | undefined, Icon: Target },
  ].filter((d) => d.value != null && d.value !== '') as { label: string; value: string | number; Icon: LucideIcon; ValueIcon?: LucideIcon }[]

  /* ---------- Links for sidebar ---------- */
  const track = (url: string | undefined) =>
    url ? buildTrackedUrl(url, entry.slug as string) : undefined

  const links: { label: string; url: string | undefined; icon: string }[] = [
    { label: 'Sitio web', url: track(entry.website as string | undefined), icon: 'globe' },
    {
      label: 'X',
      url: track(entry.x ? `https://x.com/${entry.x}` : undefined),
      icon: 'x',
    },
    {
      label: 'LinkedIn',
      url: track(
        entry.linkedin
          ? String(entry.linkedin).startsWith('http')
            ? String(entry.linkedin)
            : `https://linkedin.com/in/${entry.linkedin}`
          : undefined,
      ),
      icon: 'linkedin',
    },
    {
      label: 'GitHub',
      url: track(entry.github ? `https://github.com/${entry.github}` : undefined),
      icon: 'github',
    },
    {
      label: 'Instagram',
      url: track(entry.instagram ? `https://instagram.com/${entry.instagram}` : undefined),
      icon: 'instagram',
    },
    {
      label: 'YouTube',
      url: track(
        entry.youtube
          ? String(entry.youtube).startsWith('http')
            ? String(entry.youtube)
            : `https://youtube.com/@${entry.youtube}`
          : undefined,
      ),
      icon: 'youtube',
    },
    { label: 'Discord', url: track(entry.discord as string | undefined), icon: 'discord' },
    { label: 'Telegram', url: track(entry.telegram as string | undefined), icon: 'telegram' },
    { label: 'Portafolio', url: track(entry.portfolio as string | undefined), icon: 'globe' },
    {
      label: 'Email',
      url: entry.email ? `mailto:${entry.email}` : undefined,
      icon: 'mail',
    },
  ].filter((l) => l.url !== undefined) as { label: string; url: string; icon: string }[]

  /* ---------- Layout mode ---------- */
  const isCompactLayout = false

  const pageUrl = `${SITE_URL}/${config.slug}/${entry.slug}`

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
            { '@type': 'ListItem', position: 2, name: 'Directorio', item: `${SITE_URL}/directorio` },
            { '@type': 'ListItem', position: 3, name: config.labelPlural, item: `${SITE_URL}/${config.slug}` },
            { '@type': 'ListItem', position: 4, name: entry.name },
          ],
        }),
      }} />
      {/* Entity structured data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: safeJsonLd(
          entry.entryType === 'person'
            ? {
                '@context': 'https://schema.org',
                '@type': 'Person',
                name: entry.name,
                url: entry.website || undefined,
                jobTitle: (entry.role as string) || undefined,
                sameAs: [
                  entry.x ? `https://x.com/${entry.x}` : null,
                  entry.linkedin
                    ? String(entry.linkedin).startsWith('http')
                      ? String(entry.linkedin)
                      : `https://linkedin.com/in/${entry.linkedin}`
                    : null,
                  entry.github ? `https://github.com/${entry.github}` : null,
                  entry.instagram ? `https://instagram.com/${entry.instagram}` : null,
                ].filter(Boolean),
              }
            : {
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: entry.name,
                url: entry.website || undefined,
                description: (entry.tagline as string) || undefined,
                logo: logoUrl || undefined,
                address: entry.city && entry.city !== 'global'
                  ? { '@type': 'PostalAddress', addressLocality: getCityName(entry.city as string), addressRegion: 'Sinaloa' }
                  : undefined,
                sameAs: [
                  entry.x ? `https://x.com/${entry.x}` : null,
                  entry.linkedin
                    ? String(entry.linkedin).startsWith('http')
                      ? String(entry.linkedin)
                      : `https://linkedin.com/in/${entry.linkedin}`
                    : null,
                  entry.github ? `https://github.com/${entry.github}` : null,
                  entry.instagram ? `https://instagram.com/${entry.instagram}` : null,
                ].filter(Boolean),
              },
        ),
      }} />
      <Breadcrumb items={[
        { label: 'Inicio', href: '/' },
        { label: 'Directorio', href: '/directorio' },
        { label: config.labelPlural, href: `/${config.slug}` },
        { label: entry.name as string },
      ]} />

      {/* Two-layout mode: compact (single column) vs full (grid with sidebar) */}
      <div
        className={
          isCompactLayout
            ? 'max-w-3xl mx-auto'
            : 'lg:grid lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-4 xl:grid-cols-[minmax(0,1fr)_17rem]'
        }
      >
        {/* ============================================================ */}
        {/*  Main column                                                 */}
        {/* ============================================================ */}
        <div className={`space-y-8${!isCompactLayout ? ' max-w-3xl mx-auto lg:mx-0 lg:max-w-none' : ''}`}>
          {/* Cover image, with a consistent fallback hero for entries without one. */}
          <div className="relative">
              <div className="group relative aspect-video rounded-lg overflow-hidden bg-elevated">
                {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={entry.name as string}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
                  sizes="(max-width: 768px) 100vw, 1200px"
                  priority
                />
                ) : (
                  <div className="relative flex h-full overflow-hidden bg-gradient-to-br from-accent/25 via-elevated to-card p-6 sm:p-8">
                    <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,color-mix(in_srgb,var(--color-accent)_35%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_srgb,var(--color-accent)_35%,transparent)_1px,transparent_1px)] [background-size:28px_28px]" />
                    <div className="relative flex w-full flex-col justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-card/80 p-3 shadow-sm backdrop-blur-sm">
                          {logoUrl ? (
                            <Image
                              src={logoUrl}
                              alt={`${entry.name as string} logo`}
                              width={64}
                              height={64}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <EntryIcon className="h-7 w-7 text-accent" strokeWidth={1.5} />
                          )}
                        </div>
                        <EntryBadge entryType={entry.entryType as AtlasEntryType} />
                      </div>
                      <div className="max-w-2xl">
                        <h1 className="terminal-title text-2xl font-bold text-primary sm:text-3xl">
                          {entry.name as string}
                        </h1>
                        {entry.tagline && (
                          <p className="mt-3 text-base text-secondary sm:text-lg">
                            {entry.tagline as string}
                          </p>
                        )}
                        <p className="mt-4 flex items-center gap-1.5 text-xs font-mono text-muted">
                          <MapPin className="h-3.5 w-3.5 text-accent" />
                          {entry.city === 'global' ? 'Global' : getCityName(entry.city as string)}
                          {entry.state ? `, ${entry.state as string}` : ''}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              {/* Logo overlapping cover at bottom-left */}
              {coverUrl && logoUrl && (
                <div className="absolute -bottom-7 left-5">
                  <Image
                    src={logoUrl}
                    alt={`${entry.name as string} logo`}
                    width={56}
                    height={56}
                    className="object-contain rounded-xl border-4 border-card bg-card shadow-lg"
                  />
                </div>
              )}
          </div>

          {/* Header */}
          <div className={coverUrl && logoUrl ? 'space-y-4 pt-4' : 'space-y-4'}>
            {coverUrl ? (
              <div className="flex items-center gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <EntryBadge entryType={entry.entryType as AtlasEntryType} />
                    {entry.verified && (
                      <span className="inline-flex items-center gap-1 text-xs font-mono text-accent">
                        <BadgeCheck className="w-3 h-3" />
                        Verificado
                      </span>
                    )}
                  </div>
                  <h1 className="terminal-title text-2xl md:text-3xl font-sans font-bold text-primary">
                    {entry.name as string}
                  </h1>
                </div>
              </div>
            ) : (
              <h1 className="sr-only">{entry.name as string}</h1>
            )}

            {coverUrl && entry.tagline && (
              <p className="text-lg text-secondary">{entry.tagline as string}</p>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {entry.website && (
                <ExternalLink
                  href={track(entry.website as string)!}
                  className={buttonVariants({ variant: "accent-filled", size: "md" })}
                >
                  Visitar sitio
                  <ExternalLinkIcon className="w-4 h-4" />
                </ExternalLink>
              )}
              {/* Hiring badge */}
              {startupLike && entry.hiringUrl && (
                <ExternalLink
                  href={entry.hiringUrl as string}
                  className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-semibold text-sm rounded-lg hover:bg-emerald-500/20 transition-colors"
                >
                  <Briefcase className="w-4 h-4" />
                  Contratando
                </ExternalLink>
              )}
              {/* Available for hire badge */}
              {entry.availableForHire && (
                <span className="inline-flex items-center gap-2 px-4 py-2 border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 font-mono font-semibold text-sm rounded-lg">
                  <UserCheck className="w-4 h-4" />
                  Disponible
                </span>
              )}
              {/* Available for mentoring badge */}
              {entry.availableForMentoring && (
                <span className="inline-flex items-center gap-2 px-4 py-2 border border-blue-500/30 bg-blue-500/10 text-blue-400 font-mono font-semibold text-sm rounded-lg">
                  <GraduationCap className="w-4 h-4" />
                  Mentoria
                </span>
              )}
              <ShareButton
                title={`${entry.name as string} | Tech Atlas`}
                url={pageUrl}
                contentType="entry"
                contentId={entry.slug as string}
              />
            </div>

            {/* Compact layout: inline details strip */}
            {isCompactLayout && (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-secondary">
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-accent" />
                  {entry.city === 'global' ? 'Global' : getCityName(entry.city as string)}
                  {entry.state ? `, ${entry.state as string}` : ''}
                </span>
                {details
                  .filter((d) => d.label !== 'Categoria')
                  .map((detail) => (
                    <span key={detail.label} className="inline-flex items-center gap-1.5">
                      <detail.Icon className="w-3.5 h-3.5 text-accent" />
                      {detail.label}:{' '}
                      <span className="font-mono text-primary">{detail.value}</span>
                    </span>
                  ))}
                {links.map((link) => (
                  <a
                    key={link.label}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-secondary hover:text-accent transition-colors"
                  >
                    <SocialLinkIcon icon={link.icon} className="w-3.5 h-3.5" />
                    {link.label}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* About / Body */}
          {entry.body && (
            <Card>
              <h2 className="font-mono text-xs text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Info className="w-4 h-4 text-accent" />
                Acerca de
              </h2>
              <div className="prose prose-sm dark:prose-invert prose-p:text-secondary prose-headings:text-primary prose-a:text-accent max-w-none">
                <Markdown>{entry.body as string}</Markdown>
              </div>
            </Card>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <Card>
              <h2 className="font-mono text-xs text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <TagIcon className="w-4 h-4 text-accent" />
                Etiquetas
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs font-mono px-2 py-1 rounded bg-accent/10 text-accent border border-accent/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Technologies */}
          {technologies.length > 0 && (
            <Card>
              <h2 className="font-mono text-xs text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-accent" />
                Tecnologias
              </h2>
              <div className="flex flex-wrap gap-2">
                {technologies.map((t) => (
                  <span
                    key={t}
                    className="text-xs font-mono px-2 py-1 rounded bg-elevated text-secondary border border-border"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Card>
          )}

        </div>

        {/* ============================================================ */}
        {/*  Sidebar (only in full layout)                               */}
        {/* ============================================================ */}
        {!isCompactLayout && (
          <div className="space-y-4 mt-8 lg:mt-0 max-w-3xl mx-auto lg:mx-0 lg:max-w-none">
            {/* Details card */}
            <Card className="p-4">
              <h2 className="font-mono text-xs text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                <LayoutList className="w-4 h-4 text-accent" />
                Detalles
              </h2>
              <div className="space-y-4">
                {/* Location always shown */}
                <div className="space-y-1.5">
                  <span className="text-sm text-muted flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-muted" />
                    Ubicacion
                  </span>
                  <span className="block text-sm font-mono text-primary break-words">
                    {entry.city === 'global' ? 'Global' : getCityName(entry.city as string)}
                    {entry.state ? `, ${entry.state as string}` : ''}
                  </span>
                </div>
                {details.map((detail) => (
                  <div key={detail.label} className="space-y-1.5">
                    <span className="text-sm text-muted flex items-center gap-1.5 shrink-0">
                      <detail.Icon className="w-3.5 h-3.5 text-muted shrink-0" />
                      {detail.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-sm font-mono text-primary break-words">
                      {detail.ValueIcon && (
                        <detail.ValueIcon className="w-3.5 h-3.5 text-accent shrink-0" />
                      )}
                      {detail.value}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Links card */}
            {links.length > 0 && (
              <Card className="p-4">
                <h2 className="font-mono text-xs text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-accent" />
                  Enlaces
                </h2>
                <div className="space-y-2">
                  {links.map((link) => (
                    <a
                      key={link.label}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-secondary hover:text-accent transition-colors"
                    >
                      <SocialLinkIcon icon={link.icon} className="w-4 h-4" />
                      {link.label}
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>

      <div className={!isCompactLayout ? 'max-w-3xl mx-auto lg:max-w-none' : ''}>
        <WhatsAppCta className="mt-6" />

        {/* Suggestions */}
        {suggestions.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-primary mb-4">Mira mas</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestions.map((s) => (
                <EntryCard
                  key={String(s.id)}
                  slug={s.slug as string}
                  name={s.name as string}
                  tagline={s.tagline as string | undefined}
                  entryType={s.entryType as AtlasEntryType}
                  logo={s.logo as any}
                  coverImage={s.coverImage as any}
                  city={s.city as string}
                  tags={s.tags as any}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  )
}
