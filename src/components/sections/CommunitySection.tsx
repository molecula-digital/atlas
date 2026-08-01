import { SectionBlock } from '@/components/layout/SectionBlock'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { CommunityPhotosCarousel } from '@/components/community/CommunityPhotosCarousel'
import { getCommunityPhotos } from '@/lib/community-photos'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'
import { WHATSAPP_SURFACE } from '@/lib/analytics-events'

export async function CommunitySection() {
  const photos = await getCommunityPhotos()

  return (
    <SectionBlock id="comunidad">
      <div className="space-y-4">
        <SectionTitle description="Meetups, talleres y la gente del ecosistema tech de Sinaloa.">
          La comunidad
        </SectionTitle>

        {photos.length > 0 && <CommunityPhotosCarousel photos={photos} />}

        <WhatsAppCta surface={WHATSAPP_SURFACE.communitySection} />
      </div>
    </SectionBlock>
  )
}
