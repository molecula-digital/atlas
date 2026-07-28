import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

export default function EventTypeBadge({
  isInPerson,
  className,
}: {
  isInPerson: boolean
  className?: string
}) {
  return (
    <Badge
      tone={isInPerson ? 'success' : 'info'}
      shape="square"
      className={cn('font-semibold uppercase tracking-wider', className)}
    >
      {isInPerson ? 'Presencial' : 'Virtual'}
    </Badge>
  )
}
