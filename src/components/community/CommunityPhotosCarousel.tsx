'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import AutoScroll from 'embla-carousel-auto-scroll'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/Carousel'
import { Lightbox } from '@/components/ui/Lightbox'
import type { CommunityPhoto } from '@/lib/community-photos'

/** Enough slides for a seamless loop even with a small photo set. */
const MIN_SLIDES = 8

interface CommunityPhotosCarouselProps {
  photos: CommunityPhoto[]
}

export function CommunityPhotosCarousel({
  photos,
}: CommunityPhotosCarouselProps) {
  const [api, setApi] = useState<CarouselApi>()
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const slides = useMemo(() => {
    if (photos.length === 0) return []

    const out: Array<CommunityPhoto & { key: string; photoIndex: number }> = []
    let i = 0
    while (out.length < Math.max(photos.length * 2, MIN_SLIDES)) {
      const photoIndex = i % photos.length
      const photo = photos[photoIndex]!
      out.push({ ...photo, key: `${photo.src}-${out.length}`, photoIndex })
      i += 1
    }
    return out
  }, [photos])

  const plugins = useMemo(
    () => [
      AutoScroll({
        speed: 0.25,
        startDelay: 800,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
        stopOnFocusIn: true,
      }),
    ],
    [],
  )

  const lightboxOpen = lightboxIndex !== null

  useEffect(() => {
    const autoScroll = api?.plugins()?.autoScroll
    if (!autoScroll) return

    if (lightboxOpen) {
      autoScroll.stop()
    } else {
      autoScroll.play()
    }
  }, [api, lightboxOpen])

  if (slides.length === 0) return null

  return (
    <>
      <Carousel
        opts={{ align: 'start', loop: true, dragFree: true }}
        plugins={plugins}
        setApi={setApi}
        className="w-full"
        aria-label="Fotos de la comunidad Tech Atlas"
      >
        <div className="community-photo-marquee">
          <CarouselContent className="-ml-3">
            {slides.map((photo) => (
              <CarouselItem
                key={photo.key}
                className="pl-3 basis-[70%] xs:basis-[55%] sm:basis-[40%] md:basis-[28%] lg:basis-[22%]"
              >
                <button
                  type="button"
                  onClick={() => setLightboxIndex(photo.photoIndex)}
                  className="group relative block w-full cursor-pointer overflow-hidden rounded-lg border border-border bg-elevated text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  aria-label={`Ver ${photo.alt}`}
                >
                  <figure className="relative aspect-4/3">
                    <Image
                      src={photo.src}
                      alt={photo.alt}
                      fill
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 22vw"
                      className="pointer-events-none object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </figure>
                </button>
              </CarouselItem>
            ))}
          </CarouselContent>
        </div>
      </Carousel>

      <Lightbox
        images={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}
