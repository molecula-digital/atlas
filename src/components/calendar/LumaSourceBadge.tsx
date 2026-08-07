import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { isLumaImportedEvent, type TechEvent } from '@/lib/events'
import { lumaCalendarUrl } from '@/lib/luma/map'

type LumaSourceFields = Pick<
  TechEvent,
  'externalSource' | 'externalCalendarId' | 'externalCalendarName'
>

/**
 * Compact “Luma” label for list cards. Calendar name goes in the title tooltip.
 */
export function LumaSourceBadge({
  event,
  className,
}: {
  event: LumaSourceFields
  className?: string
}) {
  if (!isLumaImportedEvent(event)) return null

  const calendarName = event.externalCalendarName?.trim() || ''
  const title = calendarName
    ? `Importado de Luma · ${calendarName}`
    : 'Importado de Luma'

  return (
    <Badge
      tone="neutral"
      shape="square"
      title={title}
      className={cn('font-semibold uppercase tracking-wider', className)}
    >
      Luma
    </Badge>
  )
}

/**
 * Detail/modal source line: Luma badge + linked calendar name when available.
 */
export function LumaSourceDetail({
  event,
  className,
}: {
  event: LumaSourceFields
  className?: string
}) {
  if (!isLumaImportedEvent(event)) return null

  const calendarName = event.externalCalendarName?.trim() || ''
  const calendarHref = event.externalCalendarId
    ? lumaCalendarUrl(event.externalCalendarId)
    : ''

  return (
    <span className={cn('inline-flex flex-wrap items-center gap-2', className)}>
      <LumaSourceBadge event={event} />
      {calendarName &&
        (calendarHref ? (
          <a
            href={calendarHref}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-xs text-accent underline-offset-2 hover:underline"
          >
            {calendarName}
          </a>
        ) : (
          <span className="font-mono text-xs text-secondary">
            {calendarName}
          </span>
        ))}
    </span>
  )
}
