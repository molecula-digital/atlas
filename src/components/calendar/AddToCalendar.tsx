'use client'

import { useState } from 'react'
import { CalendarPlus, Download } from 'lucide-react'
import type { TechEvent } from '@/lib/events'
import { getEventPath } from '@/lib/events'
import { SITE_URL } from '@/config'
import {
  buildIcs,
  googleCalendarUrl,
  outlookCalendarUrl,
  toCalendarEvent,
  yahooCalendarUrl,
} from '@/lib/calendar-links'
import { buttonVariants, type ButtonSize } from '@/components/ui/button-variants'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/Dialog'

const optionClass =
  'flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-sm text-secondary transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-primary'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M21.35 11.1h-9.17v2.92h5.26c-.23 1.37-1.62 4.02-5.26 4.02-3.17 0-5.75-2.62-5.75-5.85s2.58-5.85 5.75-5.85c1.8 0 3.01.77 3.7 1.43l2.52-2.43C16.78 3.72 14.66 2.8 12.18 2.8 6.98 2.8 2.8 6.98 2.8 12.19s4.18 9.38 9.38 9.38c5.42 0 9-3.8 9-9.16 0-.62-.07-1.09-.16-1.31Z"
      />
    </svg>
  )
}

function OutlookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="M13.5 4.5h7a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-7v-3h6v-1.5h-6v-2h6V11.5h-6v-2h6V8h-6V4.5ZM2.5 5.6 12 4v16l-9.5-1.6V5.6Zm4.83 8.9c1.6 0 2.6-1.2 2.6-3s-1-3-2.6-3-2.6 1.2-2.6 3 1 3 2.6 3Zm0-1.35c-.72 0-1.16-.62-1.16-1.65s.44-1.65 1.16-1.65 1.16.62 1.16 1.65-.44 1.65-1.16 1.65Z"
      />
    </svg>
  )
}

function YahooIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="currentColor"
        d="m3 5.5 3.6 8.02V19.5h3.1v-5.98L13.3 5.5H10l-1.85 4.7L6.3 5.5H3Zm12.6 9.3a1.6 1.6 0 1 0 0 3.2 1.6 1.6 0 0 0 0-3.2Zm.55-1.6h2.5L21 5.5h-2.9l-1.95 7.7Z"
      />
    </svg>
  )
}

export function AddToCalendar({
  event,
  size = 'md',
}: {
  event: TechEvent
  size?: ButtonSize
}) {
  const [open, setOpen] = useState(false)
  const calEvent = toCalendarEvent(event, `${SITE_URL}${getEventPath(event.slug)}`)

  const downloadIcs = () => {
    const ics = buildIcs(calEvent, `${event.slug}@atlas.tech`)
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `${event.slug || 'evento'}.ics`
    a.click()
    URL.revokeObjectURL(url)
    setOpen(false)
  }

  const links = [
    { label: 'Google Calendar', href: googleCalendarUrl(calEvent), Icon: GoogleIcon },
    { label: 'Outlook', href: outlookCalendarUrl(calEvent), Icon: OutlookIcon },
    { label: 'Yahoo', href: yahooCalendarUrl(calEvent), Icon: YahooIcon },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className={buttonVariants({ size })}>
        <CalendarPlus size={size === 'lg' ? 15 : 13} />
        Agregar a calendario
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle>Agregar a calendario</DialogTitle>
          <DialogDescription>{event.title}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {links.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className={optionClass}
            >
              <Icon />
              {label}
            </a>
          ))}
          <button type="button" onClick={downloadIcs} className={optionClass}>
            <Download className="h-4 w-4 shrink-0" />
            Apple Calendar
            <span className="ml-auto font-mono text-2xs text-muted">.ics</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
