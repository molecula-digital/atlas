import { SectionBlock } from '@/components/layout/SectionBlock'
import { Mail } from 'lucide-react'
import { NewsletterSignup } from '@/components/newsletter/NewsletterSignup'
import { TronPanel } from '@/components/ui/TronPanel'

export function NewsletterSection() {
  return (
    <SectionBlock>
      <div className="mx-auto max-w-3xl overflow-hidden rounded-xl border border-accent/30 bg-card">
        <div className="grid md:grid-cols-3">
          <TronPanel>
            <Mail className="h-7 w-7 text-accent" strokeWidth={1.75} />
          </TronPanel>

          <div className="flex flex-col justify-center gap-5 p-6 sm:p-8 md:col-span-2">
            <div className="space-y-3">
              <h2 className="terminal-title font-sans text-xl font-bold tracking-tight text-primary uppercase sm:text-2xl">
                Recibe novedades del ecosistema
              </h2>
              <p className="max-w-md text-sm leading-relaxed text-secondary">
                Startups, eventos y lo que se está construyendo en Sinaloa —
                directo a tu inbox.
              </p>
            </div>
            <NewsletterSignup source="homepage" variant="section" />
          </div>
        </div>
      </div>
    </SectionBlock>
  )
}
