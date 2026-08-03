'use client'

import Link from 'next/link'
import { MapPin, Clock, Briefcase } from 'lucide-react'
import { PaginatedView } from '@/components/ui/PaginatedView'
import { JobCardSkeleton } from '@/components/entries/JobCardSkeleton'
import { getCityName, JOB_TYPE_LABELS, MODALITY_LABELS } from '@/config'
import { flattenArray } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import type { Job } from '@/payload-types'

function JobCard({ job }: { job: Job }) {
  const tags = flattenArray(job.tags as Array<{ tag: string }>, 'tag')
  const entryName = (job.entry as { name: string } | null)?.name

  return (
    <Link
      href={`/empleos/${job.slug}`}
      className="block bg-card border border-border rounded-lg p-4 hover:border-accent/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-base font-semibold text-primary">
            {job.title as string}
          </h2>
          {entryName && (
            <p className="text-xs text-muted font-mono mt-0.5">{entryName}</p>
          )}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted font-mono">
            <span className="flex items-center gap-1">
              <Briefcase className="w-3 h-3" />
              {JOB_TYPE_LABELS[job.type as string] || job.type}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {MODALITY_LABELS[job.modality as string] || job.modality}
            </span>
            {job.city && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {getCityName(job.city as string)}
              </span>
            )}
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {tags.slice(0, 4).map((tag) => (
                <Badge key={tag} className="text-[10px]">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        {job.compensation && (
          <span className="text-sm font-mono font-medium text-accent whitespace-nowrap">
            {job.compensation as string}
          </span>
        )}
      </div>
    </Link>
  )
}

export default function EmpleosContent() {
  return (
    <PaginatedView<Job>
      endpoint="/api/directory/jobs"
      renderItem={(job) => <JobCard job={job} />}
      renderSkeleton={() => <JobCardSkeleton />}
      layout="list"
      pageSize={12}
      emptyMessage="No hay ofertas de empleo activas."
    />
  )
}
