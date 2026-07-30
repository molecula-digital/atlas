import { Ticket, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Primary Registrarse CTA on event pages: a compact, perforated admission
 * ticket with a tear-off stub and printed-paper details.
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
        'event-cta mx-auto flex h-20 w-full max-w-md cursor-pointer items-stretch overflow-hidden rounded-lg font-mono font-semibold whitespace-nowrap select-none outline-hidden sm:h-24',
        className,
      )}
    >
      <span className="relative z-2 flex min-w-0 flex-1 flex-col justify-center px-5 sm:px-6">
        <span className="mb-1 text-[9px] font-semibold uppercase tracking-[0.22em] opacity-70">
          Entrada al evento
        </span>
        <span className="flex items-center gap-2.5 text-base tracking-tight sm:text-lg">
          <Ticket size={20} className="shrink-0" />
          Registrarse
        </span>
        <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] opacity-60">
          Reserva tu lugar
        </span>
      </span>

      <span aria-hidden className="event-cta__tear relative z-2 my-3.5 w-px shrink-0" />

      <span className="event-cta__stub relative z-2 flex w-24 shrink-0 flex-col items-center justify-center gap-2 px-3">
        <span aria-hidden className="event-cta__barcode" />
        <span className="flex items-center gap-1 text-[9px] uppercase tracking-[0.12em]">
          Acceder
          <ArrowRight size={13} />
        </span>
      </span>

      <span aria-hidden className="event-cta__notch event-cta__notch--top" />
      <span aria-hidden className="event-cta__notch event-cta__notch--bottom" />
    </a>
  )
}
