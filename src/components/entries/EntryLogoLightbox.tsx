'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Lightbox } from '@/components/ui/Lightbox'
import { cn } from '@/lib/utils'

type EntryLogoLightboxProps = {
  src: string
  alt: string
  width: number
  height: number
  className?: string
}

/** Clickable entry logo that opens the existing accessible image lightbox. */
export function EntryLogoLightbox({
  src,
  alt,
  width,
  height,
  className,
}: EntryLogoLightboxProps) {
  const [index, setIndex] = useState<number | null>(null)

  return (
    <>
      <button
        type="button"
        onClick={() => setIndex(0)}
        className="block cursor-pointer rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        aria-label={`Ampliar ${alt}`}
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn('object-contain', className)}
        />
      </button>
      <Lightbox
        images={[{ src, alt }]}
        index={index}
        onIndexChange={setIndex}
        onClose={() => setIndex(null)}
      />
    </>
  )
}
