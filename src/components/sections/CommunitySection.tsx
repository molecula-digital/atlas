import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SectionBlock } from '@/components/layout/SectionBlock'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { CommunityPhotosCarousel } from '@/components/community/CommunityPhotosCarousel'
import { getCommunityPhotos } from '@/lib/community-photos'
import { WhatsAppCta } from '@/components/sections/WhatsAppCta'

export async function CommunitySection() {
  const photos = await getCommunityPhotos()

  return (
    <SectionBlock id="comunidad">
      <div className="space-y-4">
        <SectionTitle description="Meetups, talleres y la gente del ecosistema tech de Sinaloa.">
          La comunidad
        </SectionTitle>

        {photos.length > 0 && (
          <>
            <CommunityPhotosCarousel photos={photos} />
            <p className="text-right">
              <Link
                href="/comunidad"
                className="inline-flex items-center gap-1 font-mono text-xs text-secondary transition-colors hover:text-accent"
              >
                Ver todas las fotos
                <ArrowRight className="size-3.5" />
              </Link>
            </p>
          </>
        )}

        <WhatsAppCta />
      </div>
    </SectionBlock>
  )
}
