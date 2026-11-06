'use client'

import {
  Dialog,
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
      <DialogContent showCloseButton className="sm:max-w-sm">
        <DialogHeader className="sm:text-left">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full bg-[#25D366] text-[#07342c]">
            <WhatsAppIcon className="size-5" />
          </div>
          <DialogTitle>Grupo de WhatsApp</DialogTitle>
          <DialogDescription>
            La comunidad tech de Sinaloa se escribe aquí: meetups, colaborar,
            preguntas y lo que se está armando en el estado.
          </DialogDescription>
        </DialogHeader>
        <WhatsAppJoinLink
          surface={surface}
          className={cn(
            buttonVariants({ size: 'md' }),
            WHATSAPP_BUTTON,
            'w-fit',
          )}
        >
          <WhatsAppIcon className="size-4" />
          Unirme al grupo
        </WhatsAppJoinLink>
      </DialogContent>
    </Dialog>
  )
}
