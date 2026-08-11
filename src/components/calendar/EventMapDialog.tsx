'use client'

import { ArrowUpRight, X } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { EVENT_SURFACE } from '@/lib/analytics-events'
import { buttonVariants } from '@/components/ui/button-variants'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'
import { EventExternalLink } from '@/components/calendar/EventExternalLink'

/**
 * Map detail dialog: embed when available, plus outbound Google Maps link.
 */
export function EventMapDialog({
  event,
  mapEmbedUrl,
  open,
  onOpenChange,
}: {
  event: TechEvent
  mapEmbedUrl: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!event.location || !event.mapsUrl) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden p-0 sm:max-w-xl"
        showCloseButton={false}
      >
        <DialogHeader className="flex-row items-start justify-between gap-3 space-y-0 px-5 pt-5 pb-3 text-left">
          <div className="min-w-0">
            <DialogTitle className="text-base">Ubicación</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-secondary">
              {event.location}
            </DialogDescription>
          </div>
          <DialogClose
            className={buttonVariants({
              variant: 'ghost',
              size: 'icon-md',
              className: 'shrink-0',
            })}
            aria-label="Cerrar"
          >
            <X size={18} className="text-muted" />
          </DialogClose>
        </DialogHeader>

        {mapEmbedUrl && (
          <div className="h-64 border-y border-border bg-elevated sm:h-80">
            <iframe
              src={mapEmbedUrl}
              title={`Mapa de ${event.location}`}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        )}

        <div className="p-4">
          <EventExternalLink
            event={event}
            linkType="maps"
            surface={EVENT_SURFACE.detailPage}
            className={buttonVariants({
              size: 'md',
              className: 'w-full justify-center',
            })}
          >
            Abrir en Google Maps
            <ArrowUpRight size={13} />
          </EventExternalLink>
        </div>
      </DialogContent>
    </Dialog>
  )
}
