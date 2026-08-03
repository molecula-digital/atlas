import {
  Binary,
  Blocks,
  Bot,
  Braces,
  Bug,
  CircuitBoard,
  Cloud,
  Code,
  Command,
  Cpu,
  Database,
  GitBranch,
  HardDrive,
  Package,
  Radio,
  Rocket,
  Server,
  Terminal,
  Wifi,
  Zap,
  type LucideIcon,
} from 'lucide-react'

/**
 * Depth is a single dial: tier drives size here and opacity + drift distance
 * in CSS (see .hero-icon-* in globals.css). Bigger icons drifting farther at
 * higher opacity is what reads as parallax — pick the tier and the rest
 * follows, so the three cues can't drift out of agreement per icon.
 */
type DepthTier = 'near' | 'mid' | 'far'

const TIER_SIZE: Record<DepthTier, number> = { near: 40, mid: 28, far: 20 }

interface FloatingIcon {
  icon: LucideIcon
  /** Icon center, as a percentage of the backdrop's width. */
  x: number
  /** Icon center, as a percentage of the backdrop's 52rem height. */
  y: number
  tier: DepthTier
  /**
   * Seconds per drift half-cycle — the animation runs alternate. The drift
   * is stepped (see --drift-steps in globals.css), so duration ÷ step count
   * is the jump cadence: these values are long so each icon hops once every
   * several seconds and the field reads as barely-creeping, not gliding.
   */
  duration: number
  /**
   * Negative animation delay, in seconds: each icon starts mid-cycle at a
   * different phase. A positive stagger would freeze the whole field at its
   * shared start pose until the last delay elapsed, and identical phases
   * would make every icon swing in lockstep.
   */
  delay: number
  /** Part of the thinned-out set kept below md — the rest would clutter a phone. */
  mobile?: boolean
}

/**
 * Hand-authored, never random: random placement would differ between the
 * server and client render and trip a hydration mismatch, and a fixed array
 * is tunable by eye. Positions target the dead zones of the lg hero — the
 * outer gutters beyond the max-w-280 content frame, the strip under the
 * translucent header, and the fade band below the fold of the backdrop —
 * keeping the field out from under the headline (left column) and the map
 * card (right column).
 */
const FLOATING_ICONS: FloatingIcon[] = [
  // Left gutter, top to bottom.
  {
    icon: Terminal,
    x: 3.5,
    y: 24,
    tier: 'near',
    duration: 40,
    delay: -7,
    mobile: true,
  },
  {
    icon: Rocket,
    x: 7,
    y: 38,
    tier: 'mid',
    duration: 54,
    delay: -31,
    mobile: true,
  },
  { icon: Cpu, x: 6.5, y: 52, tier: 'mid', duration: 56, delay: -23 },
  {
    icon: GitBranch,
    x: 2.5,
    y: 72,
    tier: 'far',
    duration: 72,
    delay: -44,
    mobile: true,
  },
  { icon: Package, x: 7, y: 88, tier: 'far', duration: 80, delay: -12 },
  // Strip above the headline, behind the translucent header.
  { icon: Braces, x: 14, y: 9, tier: 'far', duration: 76, delay: -15 },
  { icon: Command, x: 22, y: 13, tier: 'mid', duration: 58, delay: -40 },
  { icon: Bot, x: 30, y: 6, tier: 'mid', duration: 52, delay: -33 },
  { icon: Binary, x: 44, y: 11, tier: 'far', duration: 68, delay: -52 },
  {
    icon: Radio,
    x: 58,
    y: 7,
    tier: 'near',
    duration: 44,
    delay: -18,
    mobile: true,
  },
  { icon: Bug, x: 70, y: 10, tier: 'far', duration: 84, delay: -27 },
  // Fade band under the hero content — the mask keeps these the faintest.
  { icon: Code, x: 24, y: 86, tier: 'mid', duration: 60, delay: -10 },
  { icon: HardDrive, x: 38, y: 80, tier: 'near', duration: 48, delay: -36 },
  {
    icon: Zap,
    x: 52,
    y: 78,
    tier: 'far',
    duration: 64,
    delay: -26,
    mobile: true,
  },
  { icon: Blocks, x: 66, y: 84, tier: 'mid', duration: 50, delay: -47 },
  // Right gutter, top to bottom.
  {
    icon: Cloud,
    x: 94,
    y: 14,
    tier: 'near',
    duration: 42,
    delay: -16,
    mobile: true,
  },
  { icon: Wifi, x: 91.5, y: 30, tier: 'far', duration: 76, delay: -58 },
  {
    icon: Database,
    x: 95.5,
    y: 44,
    tier: 'mid',
    duration: 52,
    delay: -37,
    mobile: true,
  },
  { icon: CircuitBoard, x: 91, y: 62, tier: 'far', duration: 88, delay: -5 },
  { icon: Server, x: 93.5, y: 82, tier: 'mid', duration: 58, delay: -49 },
]

/**
 * The 'icons' hero variant: a sparse field of lucide glyphs creeping in
 * discrete steps.
 * Real SVG components rather than canvas — they inherit the live accent via
 * currentColor (so theme flips need no repaint hook) and stay crisp at any
 * device pixel ratio. The parent .hero-backdrop wrapper owns aria-hidden,
 * pointer-events-none, and the bottom fade mask.
 */
export function IconField() {
  return (
    <>
      {FLOATING_ICONS.map(
        ({ icon: Icon, x, y, tier, duration, delay, mobile }) => (
          <Icon
            key={`${x}-${y}`}
            size={TIER_SIZE[tier]}
            strokeWidth={1.5}
            className={`hero-icon hero-icon-${tier}${mobile ? '' : ' hidden md:block'}`}
            style={{
              left: `${x}%`,
              top: `${y}%`,
              animationDuration: `${duration}s`,
              animationDelay: `${delay}s`,
            }}
          />
        ),
      )}
    </>
  )
}
