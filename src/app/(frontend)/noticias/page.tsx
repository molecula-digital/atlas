import type { Metadata } from 'next'
import { Newspaper } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import NoticiasContent from './NoticiasContent'
import { SITE_URL } from '@/config'

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Noticias del ecosistema tecnológico de Sinaloa.',
  alternates: { canonical: `${SITE_URL}/noticias` },
  openGraph: {
    title: 'Noticias',
    description: 'Noticias del ecosistema tecnológico de Sinaloa.',
    url: `${SITE_URL}/noticias`,
  },
  twitter: { card: 'summary_large_image' },
}

export default function NoticiasPage() {
  return (
    <section>
      <PageHero
        icon={Newspaper}
        title={<>Noticias del<br />ecosistema tech</>}
        description="Lanzamientos, convocatorias y movimientos del ecosistema tecnológico de Sinaloa, en un solo lugar."
        breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Noticias' }]}
      />
      <NoticiasContent />
    </section>
  )
}
