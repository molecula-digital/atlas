import type { Metadata } from 'next'
import DirectoryFilter from '@/components/entries/DirectoryFilter'
import { SITE_URL } from '@/config'
import { getDirectoryCities } from '@/lib/entry-counts'

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
  const cities = await getDirectoryCities()

  return (
    <section>
      <DirectoryFilter cities={cities} pageSize={12} />
    </section>
  )
}
