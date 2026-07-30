'use client'

import { Check, Share2, X } from 'lucide-react'
import { buttonVariants, type ButtonSize } from '@/components/ui/button-variants'
import { useShare } from '@/hooks/useShare'
import { cn } from '@/lib/utils'

const shareLabelClass = 'share-button__label'

export default function ShareButton({
  title,
  url,
  text,
  size = 'md',
  className,
  iconOnlyOnMobile = false,
}: {
  title: string
  url: string
  text?: string
  size?: ButtonSize
  className?: string
  iconOnlyOnMobile?: boolean
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

  return (
    <button
      type="button"
      onClick={() => void share()}
      className={cn(buttonVariants({ size }), className)}
      aria-label={feedbackLabel}
    >
      {completed ? (
        <>
          <Check className="w-3.5 h-3.5 text-accent" />
          <span
            className={cn(shareLabelClass, 'text-accent', iconOnlyOnMobile && 'hidden sm:inline')}
            aria-live="polite"
          >
            {feedbackLabel}
          </span>
        </>
      ) : status === 'error' ? (
        <>
          <X className="w-3.5 h-3.5 text-red-500" />
          <span
            className={cn(shareLabelClass, 'text-red-500', iconOnlyOnMobile && 'hidden sm:inline')}
            aria-live="polite"
          >
            {feedbackLabel}
          </span>
        </>
      ) : (
        <>
          <Share2 className="w-3.5 h-3.5" />
          <span className={cn(shareLabelClass, iconOnlyOnMobile && 'hidden sm:inline')}>
            Compartir
          </span>
        </>
      )}
    </button>
  )
}
