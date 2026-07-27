import { MessageCircle, ArrowUpRight } from 'lucide-react'
import { WHATSAPP_URL } from '@/config'
import { btn } from '@/components/ui/button-styles'
import { TronPanel } from '@/components/ui/TronPanel'
import { SectionTitle } from '@/components/ui/SectionTitle'
import { CommunityPhotosCarousel } from '@/components/community/CommunityPhotosCarousel'
import { getCommunityPhotos } from '@/lib/community-photos'

export async function CommunitySection() {
  const photos = await getCommunityPhotos()

  return (
    <section id="comunidad" className="px-4 py-8">
      <div className="mx-auto max-w-280 space-y-8">
        <SectionTitle description="Meetups, talleres y la gente del ecosistema tech de Sinaloa.">
          La comunidad
        </SectionTitle>

        {photos.length > 0 && <CommunityPhotosCarousel photos={photos} />}

        <div className="overflow-hidden rounded-xl border border-accent/30 bg-card">
          <div className="grid md:grid-cols-3">
            <TronPanel>
              <MessageCircle className="h-7 w-7 text-accent" strokeWidth={1.75} />
            </TronPanel>

            <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 md:col-span-2">
              <div className="space-y-3">
                <h3 className="terminal-title font-sans text-xl font-bold tracking-tight text-primary uppercase sm:text-2xl">
                  Únete a la conversación
                </h3>
                <p className="max-w-md text-sm leading-relaxed text-secondary">
                  Grupo de WhatsApp para hablar de tech, IA, software y
                  emprendimiento en Sinaloa.
                </p>
              </div>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className={btn({ variant: 'accent', size: 'md' }, 'w-fit uppercase')}
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Unirme en WhatsApp
                <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
