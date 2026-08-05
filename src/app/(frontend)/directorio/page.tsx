import type { Metadata } from 'next'
import DirectoryFilter from '@/components/entries/DirectoryFilter'
import { SITE_URL } from '@/config'
import {
  getDirectoryCities,
  getDirectoryTypeCounts,
} from '@/lib/entry-counts'

export const metadata: Metadata = {
  title: 'Directorio',
  description:
    'Explora el directorio completo del ecosistema tecnológico de Sinaloa. Startups, consultoras, comunidades y talento tech.',
  alternates: { canonical: `${SITE_URL}/directorio` },
  openGraph: {
    title: 'Directorio',
    description:
      'Explora el directorio completo del ecosistema tecnológico de Sinaloa. Startups, consultoras, comunidades y talento tech.',
    url: `${SITE_URL}/directorio`,
  },
  twitter: { card: 'summary_large_image' },
}

export default async function DirectoryPage() {
  const [cities, typeCounts] = await Promise.all([
    getDirectoryCities(),
    getDirectoryTypeCounts(),
  ])

  return (
    <section>
      <DirectoryFilter cities={cities} typeCounts={typeCounts} pageSize={12} />
    </section>
  )
}
