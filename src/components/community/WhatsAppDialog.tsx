'use client'

import { MessageCircle } from 'lucide-react'
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
  type ButtonVariant,
} from '@/components/ui/button-variants'
import { WhatsAppJoinLink } from '@/components/community/WhatsAppJoinLink'
import type { WhatsAppSurface } from '@/lib/analytics-events'

const NOTES = [
  'Meetups, talleres y lo que se está organizando',
  'Gente que busca colaborar, contratar o aprender',
  'Preguntas de tecnología, IA y software, de cualquier nivel',
]

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
  className,
}: {
  surface: WhatsAppSurface
  label: string
  variant?: ButtonVariant
  className?: string
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className={buttonVariants({ variant, size: 'md', className })}
        >
          <MessageCircle className="size-3.5" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>El grupo de WhatsApp</DialogTitle>
          <DialogDescription>
            La comunidad tech de Sinaloa se escribe aquí. El directorio es el
            mapa; el grupo es donde esa gente conversa.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2.5">
          {NOTES.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2.5 text-sm text-secondary"
            >
              <span
                className="mt-1.5 size-1.5 shrink-0 rounded-full bg-accent"
                aria-hidden
              />
              {note}
            </li>
          ))}
        </ul>
        <WhatsAppJoinLink
          surface={surface}
          className={buttonVariants({
            variant: 'accent-filled',
            size: 'md',
            className: 'w-fit',
          })}
        >
          <MessageCircle className="size-3.5" />
          Unirme en WhatsApp
        </WhatsAppJoinLink>
      </DialogContent>
    </Dialog>
  )
}
