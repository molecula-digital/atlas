import { Ticket, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Primary Registrarse CTA on the event pages: a perforated ticket bar with a
 * light streak that sweeps across on hover. Deliberately teal rather than the
 * green accent used by the surrounding chrome, so it reads as the one thing to
 * click. Colours, sheen, tear line, and notches live in globals.css under
 * `.event-cta` — the notches are painted in --color-background, so this belongs
 * on the page background rather than inside a card.
 */
export function RegisterEventButton({
  url,
  className,
}: {
  url: string
  className?: string
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'event-cta group flex h-12 w-full items-center rounded font-mono text-sm font-semibold whitespace-nowrap select-none outline-hidden sm:h-14 sm:text-base',
        className,
      )}
    >
      <span className="flex min-w-0 flex-1 items-center gap-2.5 px-5">
        <Ticket size={18} className="shrink-0" />
        Registrarse
      </span>

      <span aria-hidden className="event-cta__tear my-2.5 w-px shrink-0" />

      <span className="flex w-20 shrink-0 items-center justify-center">
        <ArrowRight
          size={18}
          className="transition-transform duration-200 group-hover:translate-x-0.5"
        />
      </span>

      <span aria-hidden className="event-cta__notch event-cta__notch--top" />
      <span aria-hidden className="event-cta__notch event-cta__notch--bottom" />
    </a>
  )
}
