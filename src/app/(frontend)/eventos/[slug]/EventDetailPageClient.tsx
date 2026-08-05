'use client'

import { useState } from 'react'
import type { TechEvent } from '@/lib/events'
import { Lightbox } from '@/components/ui/Lightbox'
import { EventDetailView } from '@/components/calendar/EventDetailView'

export default function EventDetailPageClient({ event }: { event: TechEvent }) {
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
        showDateDisplay={false}
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
