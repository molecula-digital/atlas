import { cn } from '@/lib/utils'
import { ENTRY_TYPE_CONFIG, type AtlasEntryType } from '@/config'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'

interface EntryBadgeProps {
  entryType: AtlasEntryType
  className?: string
}

export function EntryBadge({ entryType, className }: EntryBadgeProps) {
  const config = ENTRY_TYPE_CONFIG[entryType]
  if (!config) return null
  const Icon = ENTRY_TYPE_ICON_MAP[config.icon]
  return (
    <span className={cn('inline-flex items-center gap-1 text-2xs font-mono px-2 py-0.5 rounded-full border', config.badgeColor, className)}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {config.label}
    </span>
  )
}
