'use client'

import { useCallback, useState } from 'react'
import type { MouseEvent, ReactNode } from 'react'
import { X } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { useDialogBackNavigation } from '@/hooks/useDialogBackNavigation'
import { buttonVariants } from '@/components/ui/button-variants'
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
}: EventDialogProps) {
  const [open, setOpen] = useState(false)
  const [showFullImage, setShowFullImage] = useState(false)

  const close = useCallback(() => {
    setOpen(false)
    setShowFullImage(false)
  }, [])

  // The hook refreshes its onBack ref every render, so this closure always sees
  // the current showFullImage — back closes the lightbox before the dialog.
  const { dismiss } = useDialogBackNavigation(open, close, {
    onBack: () => {
      if (showFullImage) {
        setShowFullImage(false)
        return true
      }
      return false
    },
  })

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
    e.preventDefault()
    setOpen(true)
    onOpen?.(event)
  }

  const hasImage = !!event.image

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
          className="gap-0 overflow-hidden p-0 sm:max-w-xl flex flex-col"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-5 pt-5 pb-3 shrink-0 flex items-start justify-between gap-3">
            <DialogTitle className="pr-2">{event.title}</DialogTitle>
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
            onExpandImage={hasImage ? () => setShowFullImage(true) : undefined}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={showFullImage && hasImage}
        onOpenChange={(next) => {
          if (!next) setShowFullImage(false)
        }}
      >
        {event.image && (
          <DialogContent
            overlayClassName="z-60 bg-black/80"
            className="z-60 max-w-[min(90vw,56rem)] border-0 bg-transparent p-4 shadow-none"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <DialogTitle className="sr-only">Imagen del evento {event.title}</DialogTitle>
            <DialogDescription className="sr-only">
              Vista ampliada de la imagen del evento
            </DialogDescription>
            <img
              src={event.image}
              alt={event.title}
              className="max-h-[85vh] w-full object-contain rounded-lg"
            />
            <DialogClose
              className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Cerrar imagen"
            >
              <X size={20} className="text-white" />
            </DialogClose>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
