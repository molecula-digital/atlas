export function EntryCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-card/90 border border-border rounded-lg overflow-hidden animate-pulse">
      <div className="h-36 bg-elevated" />
      <div className="p-4 space-y-2 flex-1 flex flex-col">
        <div className="h-4 w-3/4 bg-elevated rounded" />
        <div className="h-3 w-full bg-elevated rounded" />
        <div className="h-3 w-1/3 bg-elevated rounded mt-2" />
      </div>
    </div>
  )
}
