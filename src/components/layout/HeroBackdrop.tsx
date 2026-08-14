'use client'

import { usePathname } from 'next/navigation'
import { HERO_BACKDROP } from '@/config'
import { IconField } from '@/components/layout/IconField'
import { InvaderField } from '@/components/layout/InvaderField'

/**
 * Full-bleed ambient backdrop for the landing hero: floating tech icons or
 * the marching invader fleet, chosen by HERO_BACKDROP in config. It mounts
 * in the site layout (not inside the hero section) so it can reach the true
 * viewport edges.
 */
export function HeroBackdrop() {
  const pathname = usePathname()

  // Layout-mounted so it can go full-bleed, but the effect belongs to the
  // index route only.
  if (pathname !== '/') return null

  // -z-[5] slots the layer between the matrix canvas (-z-10) and the content
  // stack (z-10): on top of the grid, under everything readable. The height
  // is tuned to cover the hero plus its stats row before the bottom fade
  // (see .hero-backdrop) takes over.
  return (
    <div
      className="hero-backdrop absolute inset-x-0 top-0 -z-[5] h-[52rem] pointer-events-none"
      aria-hidden="true"
    >
      {HERO_BACKDROP === 'invaders' ? <InvaderField /> : <IconField />}
    </div>
  )
}
