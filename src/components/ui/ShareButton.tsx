'use client'

import { Check, Share2, X } from 'lucide-react'
import { buttonVariants, type ButtonSize } from '@/components/ui/button-variants'
import { useShare } from '@/hooks/useShare'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/Tooltip'

export default function ShareButton({
  title,
  url,
  text,
  size = 'md',
  className,
  iconOnly = false,
}: {
  title: string
  url: string
  text?: string
  size?: ButtonSize
  className?: string
  iconOnly?: boolean
}) {
  const { share, status } = useShare({ title, text, url, copyText: url })
  const completed = status === 'copied' || status === 'shared'
  const feedbackLabel =
    status === 'copied'
      ? 'Link copiado'
      : status === 'shared'
        ? 'Compartido'
        : status === 'error'
          ? 'No se pudo copiar'
          : 'Compartir'

  const button = (
    <button
      type="button"
      onClick={() => void share()}
      className={cn(buttonVariants({ size }), className)}
      aria-label={feedbackLabel}
    >
      {completed ? (
        <>
          <Check className="w-3.5 h-3.5 text-accent" />
          {!iconOnly && (
            <span className="text-accent" aria-live="polite">
              {feedbackLabel}
            </span>
          )}
        </>
      ) : status === 'error' ? (
        <>
          <X className="w-3.5 h-3.5 text-red-500" />
          {!iconOnly && (
            <span className="text-red-500" aria-live="polite">
              {feedbackLabel}
            </span>
          )}
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          {!iconOnly && <span>Compartir</span>}
        </>
      )}
      {iconOnly && (
        <span className="sr-only" aria-live="polite">
          {feedbackLabel}
        </span>
      )}
    </button>
  )

  if (!iconOnly) return button

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent side="top">{feedbackLabel}</TooltipContent>
    </Tooltip>
  )
}
