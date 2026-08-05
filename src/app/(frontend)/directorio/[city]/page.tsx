import type { Metadata } from 'next'
import { ALL_CITY_IDS, getCityName, SITE_URL } from '@/config'
import DirectoryFilter from '@/components/entries/DirectoryFilter'
import {
  getDirectoryCities,
  getDirectoryTypeCounts,
} from '@/lib/entry-counts'

export async function generateStaticParams() {
  return ALL_CITY_IDS.filter((id) => id !== 'global').map((city) => ({ city }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>
}): Promise<Metadata> {
  const { city } = await params
  const cityName = getCityName(city)
  const description = `Empresas, startups, comunidades y talento tech en ${cityName}, Sinaloa.`
  const canonical = `${SITE_URL}/directorio/${city}`
  return {
    title: `Directorio — ${cityName}`,
    description,
    alternates: { canonical },
    openGraph: {
      title: `Directorio — ${cityName}`,
      description,
      url: canonical,
    },
    twitter: { card: 'summary_large_image' },
  }
}

export default async function CityDirectoryPage({
  params,
}: {
  params: Promise<{ city: string }>
}) {
  const { city } = await params
  const [cities, typeCounts] = await Promise.all([
    getDirectoryCities(),
    getDirectoryTypeCounts(),
  ])

  return (
    <section>
      <DirectoryFilter
        cities={cities}
        typeCounts={typeCounts}
        initialCity={city}
        pageSize={12}
      />
    </section>
  )
}
