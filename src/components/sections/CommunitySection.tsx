import { SectionTitle } from '@/components/ui/SectionTitle'
import { CommunityPhotosCarousel } from '@/components/community/CommunityPhotosCarousel'
import { getCommunityPhotos } from '@/lib/community-photos'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'

export async function CommunitySection() {
  const photos = await getCommunityPhotos()

  return (
    <section id="comunidad" className="py-8">
      <div className="mx-auto max-w-280 space-y-8">
        <SectionTitle description="Meetups, talleres y la gente del ecosistema tech de Sinaloa.">
          La comunidad
        </SectionTitle>

        {photos.length > 0 && <CommunityPhotosCarousel photos={photos} />}

        <WhatsAppCta />
      </div>
    </section>
  )
}
