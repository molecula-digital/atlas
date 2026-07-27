'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { EventDetailView } from '@/components/calendar/EventDetailView'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/Dialog'

export default function EventDetailPageClient({ event }: { event: TechEvent }) {
  const [showFullImage, setShowFullImage] = useState(false)
  const hasImage = !!event.image

  return (
    <>
      <EventDetailView
        event={event}
        variant="page"
        onExpandImage={hasImage ? () => setShowFullImage(true) : undefined}
      />

      <Dialog
        open={showFullImage && hasImage}
        onOpenChange={(open) => {
          if (!open) setShowFullImage(false)
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
