'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/Dialog'
import { useDialogBackNavigation } from '@/hooks/useDialogBackNavigation'
import { buttonVariants } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export type LightboxImage = {
  src: string
  alt: string
}

interface LightboxProps {
  images: LightboxImage[]
  index: number | null
  onClose: () => void
  onIndexChange: (index: number) => void
}

export function Lightbox({ images, index, onClose, onIndexChange }: LightboxProps) {
  const open = index !== null && images.length > 0
  const current = open ? images[index]! : null
  const { dismiss } = useDialogBackNavigation(open, onClose)

  const goPrev = useCallback(() => {
    if (index === null || images.length === 0) return
    onIndexChange((index - 1 + images.length) % images.length)
  }, [images.length, index, onIndexChange])

  const goNext = useCallback(() => {
    if (index === null || images.length === 0) return
    onIndexChange((index + 1) % images.length)
  }, [images.length, index, onIndexChange])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [goNext, goPrev, open])

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) dismiss()
      }}
    >
      {current && (
        <DialogContent
          overlayClassName="z-60 bg-black/85"
          className="z-60 max-w-[min(94vw,64rem)] border-0 bg-transparent p-0 shadow-none sm:p-2"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          <DialogTitle className="sr-only">{current.alt}</DialogTitle>
          <DialogDescription className="sr-only">
            Vista ampliada. Usa las flechas para ver más fotos.
          </DialogDescription>

          <div className="relative flex items-center justify-center">
            <Image
              src={current.src}
              alt={current.alt}
              width={1600}
              height={1200}
              className="max-h-[85vh] w-auto max-w-full rounded-lg object-contain"
              sizes="94vw"
              priority
            />

            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-md' }),
                    'absolute top-1/2 left-2 -translate-y-1/2 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:left-3',
                  )}
                  aria-label="Foto anterior"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className={cn(
                    buttonVariants({ variant: 'ghost', size: 'icon-md' }),
                    'absolute top-1/2 right-2 -translate-y-1/2 border-white/20 bg-black/40 text-white hover:bg-black/60 hover:text-white sm:right-3',
                  )}
                  aria-label="Foto siguiente"
                >
                  <ChevronRight className="size-5" />
                </button>
              </>
            )}

            <DialogClose
              className="absolute top-3 right-3 rounded-lg bg-black/40 p-2 text-white transition-colors hover:bg-black/60"
              aria-label="Cerrar"
            >
              <X size={20} />
            </DialogClose>

            {images.length > 1 && index !== null && (
              <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/45 px-3 py-1 font-mono text-2xs text-white/90">
                {index + 1} / {images.length}
              </p>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  )
}
