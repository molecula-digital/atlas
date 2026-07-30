'use client'

import { useState } from 'react'
import type { TechEvent } from '@/lib/events'
import { Lightbox } from '@/components/ui/Lightbox'
import { EventDetailView } from '@/components/calendar/EventDetailView'

export default function EventDetailPageClient({
  event,
  showLocation = true,
  showDetailsInline = true,
  registrationClassName,
}: {
  event: TechEvent
  showLocation?: boolean
  showDetailsInline?: boolean
  registrationClassName?: string
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const hasImage = !!event.image
  const lightboxImages = hasImage
    ? [{ src: event.image!, alt: event.title }]
    : []

  return (
    <>
      <EventDetailView
        event={event}
        variant="page"
        showLocation={showLocation}
        showDetailsInline={showDetailsInline}
        showDateDisplay={false}
        registrationClassName={registrationClassName}
        onExpandImage={hasImage ? () => setLightboxIndex(0) : undefined}
      />

      <Lightbox
        images={lightboxImages}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}
