import type { Metadata } from 'next'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import EmpleosContent from './EmpleosContent'
import { SITE_URL } from '@/config'

export const metadata: Metadata = {
  title: 'Empleos',
  description: 'Ofertas de empleo y oportunidades en el ecosistema tech de Sinaloa.',
  alternates: { canonical: `${SITE_URL}/empleos` },
  openGraph: {
    title: 'Empleos',
    description: 'Ofertas de empleo y oportunidades en el ecosistema tech de Sinaloa.',
    url: `${SITE_URL}/empleos`,
  },
  twitter: { card: 'summary_large_image' },
}

export default function EmpleosPage() {
  return (
    <section>
      <Breadcrumb items={[{ label: 'Inicio', href: '/' }, { label: 'Empleos' }]} />
      <h1 className="text-3xl font-bold text-primary mb-2">Bolsa de trabajo</h1>
      <p className="text-secondary text-sm mb-8">Oportunidades en el ecosistema tech de Sinaloa.</p>
      <EmpleosContent />
    </section>
  )
}
