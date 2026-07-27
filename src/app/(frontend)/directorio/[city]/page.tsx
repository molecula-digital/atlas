import type { Metadata } from 'next'
import { ALL_CITY_IDS, getCityName, SINALOA_CITIES, SITE_URL } from '@/config'
import DirectoryFilter from '@/components/entries/DirectoryFilter'

export async function generateStaticParams() {
  return ALL_CITY_IDS.filter((id) => id !== 'global').map((city) => ({ city }))
}

export async function generateMetadata({ params }: { params: Promise<{ city: string }> }): Promise<Metadata> {
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

const staticCities = SINALOA_CITIES.map((m) => ({ id: m.id, name: m.name, count: 0 }))

export default async function CityDirectoryPage({ params }: { params: Promise<{ city: string }> }) {
  const { city } = await params

  return (
    <section className="py-4">
      <DirectoryFilter cities={staticCities} initialCity={city} pageSize={12} />
    </section>
  )
}
