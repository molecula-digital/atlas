import { MessageCircle } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button-variants'
import { WhatsAppJoinLink } from '@/components/community/WhatsAppJoinLink'
import type { WhatsAppSurface } from '@/lib/analytics-events'

/**
 * A content block, not a section — spacing belongs to whoever places it, so it
 * can sit inside an already-padded section without doubling up.
 *
 * `surface` is required because this block renders on multiple different page
 * types, and without it every one of them reported the same thing.
 */
export function WhatsAppCta({
  className,
  surface,
}: {
  className?: string
  surface: WhatsAppSurface
}) {
  return (
    <div className={className}>
      <div className="bg-card border border-border rounded-lg p-6 md:p-8 flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <MessageCircle className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-sans font-bold text-primary uppercase">
              Únete a la conversación
            </h3>
            <p className="text-xs font-mono text-muted">
              Comunidad tech de Sinaloa en WhatsApp
            </p>
          </div>
        </div>
        <p className="text-sm text-secondary text-center lg:text-left flex-1">
          Comparte ideas, encuentra colaboradores y entérate de todo lo que pasa
          en el ecosistema.
        </p>
        <WhatsAppJoinLink
          surface={surface}
          className={buttonVariants({
            variant: 'accent',
            size: 'md',
            className: 'shrink-0',
          })}
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Unirme al grupo
        </WhatsAppJoinLink>
      </div>
    </div>
  )
}
