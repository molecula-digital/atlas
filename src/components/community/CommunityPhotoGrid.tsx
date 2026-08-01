'use client'

import { useState } from 'react'
import { Lightbox } from '@/components/ui/Lightbox'
import type { CommunityPhoto } from '@/lib/community-photos'

interface CommunityPhotoGridProps {
  photos: CommunityPhoto[]
}

/**
 * Masonry gallery for the community page. CSS columns let each photo keep its
 * own aspect ratio without us knowing the intrinsic dimensions up front — the
 * browser resolves heights as the images decode.
 */
export function CommunityPhotoGrid({ photos }: CommunityPhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  if (photos.length === 0) return null

  return (
    <>
      <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
        {photos.map((photo, index) => (
          <button
            key={photo.src}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="group mb-3 block w-full cursor-pointer break-inside-avoid overflow-hidden rounded-lg border border-border bg-elevated text-left focus-visible:ring-2 focus-visible:ring-accent focus-visible:outline-none"
            aria-label={`Ver ${photo.alt}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- masonry needs
                natural heights; next/image requires dimensions we don't have from
                the bucket listing. */}
            <img
              src={photo.src}
              alt={photo.alt}
              loading="lazy"
              decoding="async"
              className="pointer-events-none h-auto w-full transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </button>
        ))}
      </div>

      <Lightbox
        images={photos}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onIndexChange={setLightboxIndex}
      />
    </>
  )
}
