'use client'

import { X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'
import {
  buttonVariants,
  type ButtonSize,
  type ButtonVariant,
} from '@/components/ui/button-variants'
import { WhatsAppIcon } from '@/components/icons/SocialIcons'
import { WhatsAppJoinLink } from '@/components/community/WhatsAppJoinLink'
import { cn } from '@/lib/utils'
import type { WhatsAppSurface } from '@/lib/analytics-events'

const TOPICS = ['Meetups', 'Colaborar', 'Preguntas', 'Empleo']

const WHATSAPP_BUTTON =
  'border-[#128C7E] bg-[#25D366] text-[#07342c] hover:border-[#0f7a62] hover:bg-[#1ebe5a] hover:text-[#07342c]'

/**
 * The invitation to the WhatsApp community.
 *
 * The trigger stays on the page; the dialog is where someone decides to
 * leave for the group. `surface` is reported only when they follow the join
 * link, so opening the dialog is not counted as a join.
 */
export function WhatsAppDialog({
  surface,
  label,
  variant = 'accent-filled',
  appearance = 'default',
  size = 'md',
  className,
}: {
  surface: WhatsAppSurface
  label: string
  variant?: ButtonVariant
  /** `whatsapp` paints the trigger in WhatsApp green, with the brand mark. */
  appearance?: 'default' | 'whatsapp'
  size?: ButtonSize
  className?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={buttonVariants({
            variant,
            size,
            className: cn(
              appearance === 'whatsapp' && WHATSAPP_BUTTON,
              className,
            ),
          })}
        >
          {appearance === 'whatsapp' ? (
            <WhatsAppIcon className="size-4" />
          ) : null}
          {label}
        </button>
      </DialogTrigger>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-md"
        showCloseButton={false}
      >
        <div className="relative bg-[#075E54] px-6 pt-7 pb-6 text-white">
          <DialogClose
            className="absolute top-3 right-3 flex size-8 cursor-pointer items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="size-4" />
          </DialogClose>
          <DialogHeader className="items-start text-left">
            <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#25D366] text-[#075E54]">
              <WhatsAppIcon className="size-7" />
            </div>
            <DialogTitle className="text-2xl text-white">
              Comunidad Tech Atlas
            </DialogTitle>
            <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-white/70">
              Grupo de WhatsApp · Sinaloa
            </p>
          </DialogHeader>
        </div>

        <div className="space-y-5 px-6 py-6">
          <DialogDescription className="text-base leading-relaxed text-secondary">
            El directorio es el mapa. El grupo es donde esa gente se escribe:
            tecnología, IA, software y lo que se está armando en el estado.
          </DialogDescription>
          <ul className="flex flex-wrap gap-2">
            {TOPICS.map((topic) => (
              <li
                key={topic}
                className="rounded-full border border-border bg-elevated px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-secondary"
              >
                {topic}
              </li>
            ))}
          </ul>
          <WhatsAppJoinLink
            surface={surface}
            className={cn(
              buttonVariants({ size: 'lg' }),
              WHATSAPP_BUTTON,
              'w-full py-2.5',
            )}
          >
            <WhatsAppIcon className="size-4" />
            Unirme en WhatsApp
          </WhatsAppJoinLink>
        </div>
      </DialogContent>
    </Dialog>
  )
}
