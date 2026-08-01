'use client'

import { useCallback, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { X } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { captureEventCardClicked, type EventSurface } from '@/lib/analytics'
import { useDialogBackNavigation } from '@/hooks/useDialogBackNavigation'
import { buttonVariants } from '@/components/ui/button-variants'
import { Lightbox } from '@/components/ui/Lightbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/Dialog'
import { EventDetailView } from './EventDetailView'

interface EventDialogProps {
  event: TechEvent
  /** Applied to the anchor that opens the dialog. */
  className?: string
  children: ReactNode
  'aria-label'?: string
  title?: string
  /** Fires when the dialog opens — lets a parent react (e.g. scroll a calendar to the month). */
  onOpen?: (event: TechEvent) => void
  /** Which listing this card belongs to, for discovery-path attribution. */
  surface: EventSurface
}

/**
 * An event card that opens its details in a dialog.
 *
 * Renders a real anchor to `/eventos/[slug]` so the link stays crawlable and
 * modified clicks (cmd, ctrl, shift, alt, middle) navigate normally; a plain
 * left-click opens the dialog instead.
 */
export function EventDialog({
  event,
  className,
  children,
  onOpen,
  title,
  'aria-label': ariaLabel,
  surface,
}: EventDialogProps) {
  const [open, setOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const close = useCallback(() => {
    setOpen(false)
    setLightboxIndex(null)
  }, [])

  const { dismiss } = useDialogBackNavigation(open, close, {
    onBack: () => {
      if (lightboxIndex !== null) {
        setLightboxIndex(null)
        return true
      }
      return false
    },
  })

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // A modified click keeps the anchor's normal behaviour and lands on the
    // full page, so it is reported as a different destination.
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      captureEventCardClicked(event, surface, 'page')
      return
    }
    e.preventDefault()
    captureEventCardClicked(event, surface, 'modal')
    setOpen(true)
    onOpen?.(event)
  }

  const hasImage = !!event.image
  const lightboxImages = hasImage
    ? [{ src: event.image!, alt: event.title }]
    : []

  return (
    <>
      <a
        href={getEventPath(event.slug)}
        onClick={handleClick}
        className={className}
        aria-label={ariaLabel}
        title={title}
      >
        {children}
      </a>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) dismiss()
        }}
      >
        <DialogContent
          className="flex max-h-[min(90vh,48rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-2xl"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="flex shrink-0 items-start justify-between gap-3 px-5 pt-5 pb-2">
            <DialogTitle className="pr-2 text-lg leading-snug">{event.title}</DialogTitle>
            <DialogClose
              className={buttonVariants({ variant: 'ghost', size: 'icon-md', className: 'shrink-0' })}
              aria-label="Cerrar"
            >
              <X size={18} className="text-muted" />
            </DialogClose>
          </div>
          <DialogDescription className="sr-only">
            Detalles del evento {event.title}
          </DialogDescription>
          <EventDetailView
            event={event}
            variant="modal"
            onClose={close}
            onExpandImage={hasImage ? () => setLightboxIndex(0) : undefined}
          />
        </DialogContent>
      </Dialog>

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
        manageBackNavigation={false}
      />
    </>
  )
}
