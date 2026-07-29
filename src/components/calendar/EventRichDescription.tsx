'use client'

import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Event } from '@/payload-types'
import { cn } from '@/lib/utils'

type EventRichDescriptionProps = {
  data: NonNullable<Event['description']>
  className?: string
}

/** Renders a Payload Lexical event description with shared prose styles. */
export function EventRichDescription({ data, className }: EventRichDescriptionProps) {
  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        'prose-p:text-secondary prose-li:text-secondary prose-strong:text-primary',
        'prose-headings:text-primary prose-a:text-accent prose-a:no-underline hover:prose-a:underline',
        'prose-p:leading-relaxed prose-p:my-2 prose-ul:my-2 prose-ol:my-2',
        'prose-headings:font-sans prose-headings:font-semibold',
        'prose-h1:text-lg prose-h2:text-base prose-h3:text-sm',
        className,
      )}
    >
      <RichText data={data} />
    </div>
  )
}
