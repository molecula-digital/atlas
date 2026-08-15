'use client'

import { useCallback, useState } from 'react'
import { InvaderField } from '@/components/layout/InvaderField'
import { useKonamiCode } from '@/hooks/useKonamiCode'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog'

export function KonamiEasterEgg() {
  const [open, setOpen] = useState(false)
  const onMatch = useCallback(() => setOpen(true), [])

  useKonamiCode(onMatch)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Easter Egg</DialogTitle>
          <DialogDescription className="font-mono text-xs">
            Space Invaders — solo mira, no hay juego.
          </DialogDescription>
        </DialogHeader>
        <div className="hero-backdrop relative h-56 overflow-hidden rounded-lg border border-border bg-background/80">
          <InvaderField />
        </div>
      </DialogContent>
    </Dialog>
  )
}
