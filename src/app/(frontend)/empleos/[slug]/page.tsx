import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { RichText } from '@payloadcms/richtext-lexical/react'
import Link from 'next/link'
import { getJobBySlug, getActiveJobs } from '@/lib/payload'
import { getCityName, JOB_TYPE_LABELS, MODALITY_LABELS, SITE_URL, ENTRY_TYPE_CONFIG } from '@/config'
import type { AtlasEntryType } from '@/config'
import { flattenArray, safeJsonLd } from '@/lib/utils'
import { formatDateEs } from '@/lib/format'
import { Badge } from '@/components/ui/Badge'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { JobApplyLink } from '@/components/entries/JobApplyLink'
import { MapPin, Clock, Briefcase, AlertTriangle } from 'lucide-react'

export const revalidate = 3600

export async function generateStaticParams() {
  const result = await getActiveJobs()
  return result.docs.map((job) => ({ slug: job.slug as string }))
}

function isExpired(expiresAt: string | undefined | null): boolean {
  if (!expiresAt) return false
  return new Date(expiresAt) < new Date()
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const job = await getJobBySlug(slug)
  if (!job) return { title: 'Not Found' }
  const entryName = (job.entry as { name: string } | null)?.name
  const description = entryName
    ? `${job.title} en ${entryName}${job.city ? ` — ${getCityName(job.city as string)}, Sinaloa` : ''}`
    : `${job.title}${job.city ? ` — ${getCityName(job.city as string)}, Sinaloa` : ''}`
  const canonical = `${SITE_URL}/empleos/${job.slug}`
  const expired = isExpired(job.expiresAt as string)
  return {
    title: `${job.title} — Empleos`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${job.title} — Empleos`,
      description,
      url: canonical,
    },
    twitter: { card: 'summary_large_image' },
    ...(expired ? { robots: { index: false } } : {}),
  }
}

export default async function JobDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const job = await getJobBySlug(slug)
  if (!job) notFound()

  const tags = flattenArray(job.tags as Array<{ tag: string }>, 'tag')
  const entry = job.entry as { name: string; slug: string; entryType: AtlasEntryType } | null
  const entryName = entry?.name
  const entryHref = entry ? `/${ENTRY_TYPE_CONFIG[entry.entryType]?.slug}/${entry.slug}` : null
  const expired = isExpired(job.expiresAt as string)

  // Extract plain text from Lexical rich text for structured data
  function extractPlainText(richText: unknown): string {
    if (!richText || typeof richText !== 'object') return ''
    const root = (richText as { root?: { children?: unknown[] } }).root
    if (!root?.children) return ''
    const parts: string[] = []
    function walk(nodes: unknown[]) {
      for (const node of nodes) {
        if (typeof node !== 'object' || node === null) continue
        const n = node as { text?: string; children?: unknown[] }
        if (typeof n.text === 'string') parts.push(n.text)
        if (Array.isArray(n.children)) walk(n.children)
      }
    }
    walk(root.children)
    return parts.join(' ').replace(/\s+/g, ' ').trim()
  }

  const jobDescriptionText = extractPlainText(job.description) ||
    `${job.title}${entryName ? ` en ${entryName}` : ''}${job.city ? ` — ${getCityName(job.city as string)}, Sinaloa` : ''}`

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: safeJsonLd({
          '@context': 'https://schema.org',
          '@type': 'JobPosting',
          title: job.title,
          description: jobDescriptionText,
          datePosted: job.createdAt,
          validThrough: job.expiresAt,
          employmentType: job.type === 'full-time' ? 'FULL_TIME' : job.type === 'part-time' ? 'PART_TIME' : 'OTHER',
          jobLocationType: job.modality === 'remote' ? 'TELECOMMUTE' : undefined,
          hiringOrganization: entryName ? { '@type': 'Organization', name: entryName } : undefined,
          applicantLocationRequirements: job.city ? { '@type': 'State', name: 'Sinaloa' } : undefined,
        }),
      }} />
      <Breadcrumb items={[
        { label: 'Inicio', href: '/' },
        { label: 'Empleos', href: '/empleos' },
        { label: job.title as string },
      ]} />

      <div className="max-w-3xl mx-auto">
        {expired && (
          <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-lg px-4 py-3 mb-6">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm font-medium">Esta vacante ha expirado</p>
          </div>
        )}

        <h1 className="text-3xl font-bold text-primary mb-2">{job.title as string}</h1>
        {entryName && (
          <p className="text-sm text-muted font-mono mb-4">
            Publicado por{' '}
            {entryHref ? (
              <Link href={entryHref} className="text-accent hover:underline">{entryName}</Link>
            ) : (
              entryName
            )}
          </p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-2xs font-mono text-muted uppercase">Tipo</p>
            <p className="text-sm text-primary font-medium flex items-center gap-1"><Briefcase className="w-3.5 h-3.5" />{JOB_TYPE_LABELS[job.type as string] || job.type}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-3">
            <p className="text-2xs font-mono text-muted uppercase">Modalidad</p>
            <p className="text-sm text-primary font-medium flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{MODALITY_LABELS[job.modality as string] || job.modality}</p>
          </div>
          {job.city && (
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-2xs font-mono text-muted uppercase">Ubicación</p>
              <p className="text-sm text-primary font-medium flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{getCityName(job.city as string)}</p>
            </div>
          )}
          {job.compensation && (
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-2xs font-mono text-muted uppercase">Compensación</p>
              <p className="text-sm text-accent font-medium">{job.compensation as string}</p>
            </div>
          )}
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-6">
            {tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
          </div>
        )}

        <div className="prose prose-sm dark:prose-invert max-w-none mb-8">
          <RichText data={job.description as any} />
        </div>

        {!expired && (
          <div className="bg-accent/10 border border-accent/20 rounded-lg p-6 text-center">
            <p className="text-sm text-primary font-medium mb-3">Interesado en esta oportunidad?</p>
            <JobApplyLink
              href={job.contactUrl as string}
              slug={job.slug as string}
              title={job.title as string}
              company={entryName}
              modality={job.modality as string | null}
            />
          </div>
        )}

        <p className="text-2xs text-muted font-mono mt-4 text-center">
          {expired ? 'Esta oferta expiró' : 'Esta oferta expira'} el {formatDateEs(job.expiresAt as string)}
        </p>
      </div>
    </article>
  )
}
