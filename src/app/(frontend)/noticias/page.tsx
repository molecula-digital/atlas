import type { Metadata } from 'next'
import { SectionHeading } from '@/components/ui/SectionHeading'
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
    <section className="py-8">
      <div className="max-w-4xl mx-auto">
        <SectionHeading>Noticias</SectionHeading>
        <h1 className="text-3xl font-bold text-primary mb-8">Noticias del ecosistema tech</h1>
        <NoticiasContent />
      </div>
    </section>
  )
}
