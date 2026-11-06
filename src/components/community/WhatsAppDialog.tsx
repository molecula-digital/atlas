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
import type { WhatsAppSurface } from '@/lib/analytics-events'

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
  size = 'md',
  className,
}: {
  surface: WhatsAppSurface
  label: string
  variant?: ButtonVariant
  size?: ButtonSize
  className?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={buttonVariants({ variant, size, className })}
        >
          <WhatsAppIcon className="size-4" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton className="sm:max-w-sm">
        <DialogHeader className="sm:text-left">
          <div className="mb-1 flex size-10 items-center justify-center rounded-full border border-accent/20 bg-accent/10 text-accent">
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
          className={buttonVariants({
            variant: 'accent-filled',
            size: 'md',
            className: 'w-fit',
          })}
        >
          <WhatsAppIcon className="size-4" />
          Unirme al grupo
        </WhatsAppJoinLink>
      </DialogContent>
    </Dialog>
  )
}
