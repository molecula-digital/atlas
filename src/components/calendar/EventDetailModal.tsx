'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { EVENT_DETAIL_EVENT, EVENT_CLOSE_EVENT } from '@/lib/event-bus'
import { useDialogBackNavigation } from '@/hooks/useDialogBackNavigation'
import { btn } from '@/components/ui/button-styles'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/Dialog'
import { EventDetailView } from './EventDetailView'

export default function EventDetailModal() {
  const [event, setEvent] = useState<TechEvent | null>(null)
  const [showFullImage, setShowFullImage] = useState(false)
  const showFullImageRef = useRef(showFullImage)
  showFullImageRef.current = showFullImage

  const close = useCallback(() => {
    setEvent(null)
    setShowFullImage(false)
  }, [])

  useEffect(() => {
    const openHandler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.title) setEvent(detail as TechEvent)
    }
    const closeHandler = () => close()
    window.addEventListener(EVENT_DETAIL_EVENT, openHandler)
    window.addEventListener(EVENT_CLOSE_EVENT, closeHandler)
    return () => {
      window.removeEventListener(EVENT_DETAIL_EVENT, openHandler)
      window.removeEventListener(EVENT_CLOSE_EVENT, closeHandler)
    }
  }, [close])

  const eventUrl = event ? getEventPath(event.slug) : null

  const { dismiss } = useDialogBackNavigation(!!event, close, {
    url: eventUrl,
    onBack: () => {
      if (showFullImageRef.current) {
        setShowFullImage(false)
        return true
      }
      return false
    },
  })

  const hasImage = !!event?.image

  return (
    <>
      <Dialog
        open={!!event}
        onOpenChange={(open) => {
          if (!open) dismiss()
        }}
      >
        {event && (
          <DialogContent
            className="gap-0 overflow-hidden p-0 sm:max-w-xl flex flex-col"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            <div className="px-5 pt-5 pb-3 shrink-0 flex items-start justify-between gap-3">
              <DialogTitle className="pr-2">{event.title}</DialogTitle>
              <DialogClose
                className={btn({ variant: 'ghost', size: 'md', icon: true }, 'shrink-0')}
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
              onExpandImage={hasImage ? () => setShowFullImage(true) : undefined}
            />
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={showFullImage && hasImage}
        onOpenChange={(open) => {
          if (!open) setShowFullImage(false)
        }}
      >
        {event?.image && (
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
