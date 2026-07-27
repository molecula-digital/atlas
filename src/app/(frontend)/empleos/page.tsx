import type { Metadata } from 'next'
import { Briefcase } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
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
      <PageHero
        icon={Briefcase}
        title={<>Bolsa<br />de trabajo</>}
        description="Vacantes, prácticas y proyectos freelance en el ecosistema tech de Sinaloa. Encuentra tu siguiente oportunidad."
        breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Empleos' }]}
      />
      <EmpleosContent />
    </section>
  )
}
