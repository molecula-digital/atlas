import type { Metadata } from 'next'
import { CalendarDays } from 'lucide-react'
import { CalendarSection } from '@/components/sections/CalendarSection'
import { PastEventsSection } from '@/components/sections/PastEventsSection'
import { PageHero } from '@/components/ui/PageHero'
import { SITE_URL } from '@/config'

export const metadata: Metadata = {
  title: 'Eventos Tech en Sinaloa',
  description: 'Meetups, talleres, hackatones y conferencias tech en Sinaloa, México.',
  alternates: { canonical: `${SITE_URL}/eventos` },
  openGraph: {
    title: 'Eventos Tech en Sinaloa',
    description: 'Meetups, talleres, hackatones y conferencias tech en Sinaloa, México.',
    url: `${SITE_URL}/eventos`,
  },
  twitter: { card: 'summary_large_image' },
}

export default function EventosPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Eventos Tech en Sinaloa',
          description: 'Meetups, talleres, hackatones y conferencias tech en Sinaloa, México.',
          url: `${SITE_URL}/eventos`,
        }),
      }} />
      <PageHero
        icon={CalendarDays}
        title={<>Eventos tech<br />en Sinaloa</>}
        description="Meetups, talleres, hackatones y conferencias. Conecta con la comunidad tecnológica de Sinaloa y no te pierdas ni un solo evento."
        breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Eventos' }]}
      />
      <CalendarSection placement="events_page" />
      <PastEventsSection />
    </>
  )
}
