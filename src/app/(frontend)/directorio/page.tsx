import type { Metadata } from 'next'
import DirectoryFilter from '@/components/entries/DirectoryFilter'
import { SINALOA_CITIES, SITE_URL } from '@/config'

export const metadata: Metadata = {
  title: 'Directorio',
  description:
    'Explora el directorio completo del ecosistema tecnológico de Sinaloa. Startups, consultorías, comunidades y talento tech.',
  alternates: { canonical: `${SITE_URL}/directorio` },
  openGraph: {
    title: 'Directorio',
    description:
      'Explora el directorio completo del ecosistema tecnológico de Sinaloa. Startups, consultorías, comunidades y talento tech.',
    url: `${SITE_URL}/directorio`,
  },
  twitter: { card: 'summary_large_image' },
}

const staticCities = SINALOA_CITIES.map((m) => ({
  id: m.id,
  name: m.name,
  count: 0,
}))

export default function DirectoryPage() {
  return (
    <section>
      <DirectoryFilter cities={staticCities} pageSize={12} />
    </section>
  )
}
