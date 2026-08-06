import type { Metadata } from 'next'
import {
  ENTRY_TYPE_CONFIG,
  URL_CATEGORY_MAP,
  SITE_URL,
  type AtlasEntryType,
} from '@/config'
import DirectoryFilter from '@/components/entries/DirectoryFilter'
import { getDirectorySidebarData } from '@/lib/entry-counts'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  return Object.values(ENTRY_TYPE_CONFIG).map((c) => ({ category: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>
}): Promise<Metadata> {
  const { category } = await params
  const entryType = URL_CATEGORY_MAP[category]
  if (!entryType) return { title: 'Not Found' }
  const config = ENTRY_TYPE_CONFIG[entryType]
  const canonical = `${SITE_URL}/${config.slug}`
  return {
    title: config.labelPlural,
    description: config.description,
    alternates: { canonical },
    openGraph: {
      title: config.labelPlural,
      description: config.description,
      url: canonical,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const entryType = URL_CATEGORY_MAP[category] as AtlasEntryType | undefined
  if (!entryType) notFound()

  const { cities, typeCounts, total } = await getDirectorySidebarData()

  return (
    <section>
      <DirectoryFilter
        cities={cities}
        typeCounts={typeCounts}
        totalCount={total}
        initialType={entryType}
        pageSize={12}
      />
    </section>
  )
}
