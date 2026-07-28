import { Badge } from '@/components/ui/Badge'
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
    <Badge className={className}>
      {Icon && <Icon className="h-3 w-3" aria-hidden="true" />}
      {config.label}
    </Badge>
  )
}
