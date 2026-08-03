import Image from 'next/image'
import { cn } from '@/lib/utils'

const LOGO_WIDTH = 393
const LOGO_HEIGHT = 109

interface AtlasLogoProps {
  /** Sizing classes — set a height and leave the width auto to keep the ratio. */
  className?: string
  priority?: boolean
}

/**
 * Wordmark that swaps with the theme. Both variants ship in the markup and CSS
 * picks one, so there is no flash or hydration mismatch on the theme class.
 */
export function AtlasLogo({
  className = 'h-4 w-auto',
  priority = false,
}: AtlasLogoProps) {
  return (
    <>
      <Image
        src="/atlas-light-bg.png"
        alt="Tech Atlas"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={cn(className, 'block dark:hidden')}
      />
      <Image
        src="/atlas-dark-bg.png"
        alt=""
        aria-hidden="true"
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        priority={priority}
        className={cn(className, 'hidden dark:block')}
      />
    </>
  )
}
