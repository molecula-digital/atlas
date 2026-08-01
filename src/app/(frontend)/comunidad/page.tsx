import type { Metadata } from 'next'
import { Images, ImageOff } from 'lucide-react'
import { PageHero } from '@/components/ui/PageHero'
import { Pagination } from '@/components/ui/Pagination'
import { EmptyState } from '@/components/ui/EmptyState'
import { CommunityPhotoGrid } from '@/components/community/CommunityPhotoGrid'
import { getCommunityPhotosOrdered } from '@/lib/community-photos'
import { SITE_URL } from '@/config'

const TITLE = 'La comunidad en fotos'
const DESCRIPTION =
  'Meetups, talleres y hackatones del ecosistema tech de Sinaloa. La comunidad, tal como se ve.'

const PAGE_SIZE = 42

type PageProps = { searchParams: Promise<{ page?: string }> }

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { page } = await searchParams
  const pageNumber = parsePage(page)
  const canonical =
    pageNumber > 1 ? `${SITE_URL}/comunidad?page=${pageNumber}` : `${SITE_URL}/comunidad`

  return {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical },
    openGraph: { title: TITLE, description: DESCRIPTION, url: canonical },
    twitter: { card: 'summary_large_image' },
  }
}

/** `?page=` is user input — anything that isn't a positive integer means page 1. */
function parsePage(value: string | undefined): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed < 1) return 1
  return parsed
}

export default async function ComunidadPage({ searchParams }: PageProps) {
  const [{ page }, photos] = await Promise.all([searchParams, getCommunityPhotosOrdered()])

  const totalPages = Math.max(1, Math.ceil(photos.length / PAGE_SIZE))
  // Clamp rather than 404 so a stale deep link still lands on real photos.
  const currentPage = Math.min(parsePage(page), totalPages)
  const start = (currentPage - 1) * PAGE_SIZE
  const pagePhotos = photos.slice(start, start + PAGE_SIZE)

  return (
    <section>
      <script type="application/ld+json" dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: TITLE,
          description: DESCRIPTION,
          url: `${SITE_URL}/comunidad`,
        }),
      }} />
      <PageHero
        icon={Images}
        title={<>La comunidad<br />en fotos</>}
        description={DESCRIPTION}
        breadcrumb={[{ label: 'Inicio', href: '/' }, { label: 'Comunidad' }]}
      />

      {pagePhotos.length === 0 ? (
        <EmptyState icon={ImageOff} title="Todavía no hay fotos por aquí." />
      ) : (
        <>
          <CommunityPhotoGrid photos={pagePhotos} />
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            hrefFor={(target) => (target > 1 ? `/comunidad?page=${target}` : '/comunidad')}
          />
        </>
      )}
    </section>
  )
}
