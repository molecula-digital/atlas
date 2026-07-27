import type { Metadata } from 'next'
import { getFeaturedEntries, getLatestEntries } from '@/lib/payload'
import { getEntryCounts } from '@/lib/entry-counts'
import { FAQS, SITE_URL, SITE_DESCRIPTION } from '@/config'

import { HeroSection } from '@/components/sections/HeroSection'
import { FeaturedSection } from '@/components/sections/FeaturedSection'
import MapSection from '@/components/sections/MapSection'
import { CalendarSection } from '@/components/sections/CalendarSection'
import { FaqSection } from '@/components/sections/FaqSection'
import { CommunitySection } from '@/components/sections/CommunitySection'
import { CombinedCtaSection } from '@/components/sections/CombinedCtaSection'
import UpcomingEventsStrip from '@/components/calendar/UpcomingEventsStrip'

export const metadata: Metadata = {
  title: 'Tech Atlas — Ecosistema Tech de Sinaloa',
  description: SITE_DESCRIPTION,
  alternates: { canonical: SITE_URL },
  openGraph: {
    title: 'Tech Atlas — Ecosistema Tech de Sinaloa',
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/og.jpg` }],
  },
  twitter: { card: 'summary_large_image' },
}

export default async function HomePage() {
  const [counts, featuredResult] = await Promise.all([
    getEntryCounts(),
    getFeaturedEntries(),
  ])

  const featured = featuredResult.docs
  const latestResult = await getLatestEntries(
    5,
    featured.map((entry) => entry.slug),
  )
  const latest = latestResult.docs
  const totalEntries = Math.floor(counts.total / 5) * 5
  const homeDescription = `Explora ${totalEntries}+ startups, consultorías, comunidades y talento tech en Sinaloa.`

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Tech Atlas',
            url: SITE_URL,
            logo: `${SITE_URL}/android-chrome-512x512.png`,
            description: homeDescription,
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQS.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SiteNavigationElement',
            name: ['Startups', 'Consultorías', 'Comunidades', 'Centros de Investigación', 'Personas', 'Eventos', 'Directorio'],
            url: [
              `${SITE_URL}/startups`,
              `${SITE_URL}/consultoras`,
              `${SITE_URL}/comunidades`,
              `${SITE_URL}/centros-de-investigacion`,
              `${SITE_URL}/personas`,
              `${SITE_URL}/eventos`,
              `${SITE_URL}/directorio`,
            ],
          }),
        }}
      />

      <HeroSection cityCounts={counts.byCity} typeCounts={counts.byType} />

      <section className="py-4">
        <UpcomingEventsStrip />
      </section>

      <CommunitySection />
      <FeaturedSection entries={featured as any} latestEntries={latest as any} />
      <MapSection cityCounts={counts.byCity} cityTypeCounts={counts.byCityAndType} />
      <CalendarSection />
      <FaqSection />
      <CombinedCtaSection />
    </>
  )
}
