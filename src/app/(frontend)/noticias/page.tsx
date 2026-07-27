import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
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
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Noticias' }]} />
      <h1 className="text-3xl font-bold text-primary mb-8">Noticias del ecosistema tech</h1>
      <NoticiasContent />
    </section>
  )
}
