import type { Metadata } from 'next'
import { ENTRY_TYPE_CONFIG, URL_CATEGORY_MAP, SINALOA_CITIES, SITE_URL, type AtlasEntryType } from '@/config'
import DirectoryFilter from '@/components/entries/DirectoryFilter'
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

const staticCities = SINALOA_CITIES.map((m) => ({ id: m.id, name: m.name, count: 0 }))

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>
}) {
  const { category } = await params
  const entryType = URL_CATEGORY_MAP[category] as AtlasEntryType | undefined
  if (!entryType) notFound()

  return (
    <section className="py-4">
      <div className="max-w-280 mx-auto">
        <DirectoryFilter cities={staticCities} initialType={entryType} pageSize={12} />
      </div>
    </section>
  )
}
