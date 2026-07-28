'use client'

import Link from 'next/link'
import { EntryBadge } from '@/components/entries/EntryBadge'
import { getCityName, ENTRY_TYPE_CONFIG, type AtlasEntryType } from '@/config'
import { ENTRY_TYPE_ICON_MAP } from '@/lib/icons'
import { timeAgo } from '@/lib/utils'
import { CheckCircle, Clock, XCircle, Pencil, ExternalLink, Plus, FolderKanban, AlertTriangle } from 'lucide-react'
import { useUserResource } from '@/hooks/useUserResource'
import { EmptyState } from '@/components/ui/EmptyState'
import { buttonVariants } from '@/components/ui/button-variants'

interface Entry {
  id: string
  name: string
  entryType: AtlasEntryType
  city: string
  slug: string
  _status: 'draft' | 'published'
  moderationNote?: string
  updatedAt: string
}

export function MyEntries() {
  const { data: entries, loading, error } = useUserResource<Entry>('/api/user/entries')

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="flex gap-3">
          <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3">
            <div className="h-6 w-8 bg-elevated rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-elevated rounded mx-auto" />
          </div>
          <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3">
            <div className="h-6 w-8 bg-elevated rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-elevated rounded mx-auto" />
          </div>
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-elevated" />
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="h-4 w-16 bg-elevated rounded-full" />
                <div className="h-4 w-20 bg-elevated rounded-full" />
              </div>
              <div className="h-4 w-48 bg-elevated rounded" />
              <div className="h-3 w-32 bg-elevated rounded" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertTriangle}
        title="No pudimos cargar tus registros"
        subtitle={error}
      />
    )
  }

  if (entries.length === 0) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="No tienes registros"
        subtitle="Agrega tu primer registro al directorio"
        action={
          <Link
            href="/dashboard/entries/new"
            className={buttonVariants({ variant: "accent", size: "md" })}
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar registro
          </Link>
        }
      />
    )
  }

  const publishedCount = entries.filter((e) => e._status === 'published').length
  const pendingCount = entries.filter((e) => e._status === 'draft').length

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="flex gap-3">
        <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-center">
          <div className="text-lg font-bold text-accent">{publishedCount}</div>
          <div className="text-2xs font-mono text-muted uppercase">Publicados</div>
        </div>
        <div className="flex-1 bg-card border border-border rounded-lg px-4 py-3 text-center">
          <div className="text-lg font-bold text-secondary">{pendingCount}</div>
          <div className="text-2xs font-mono text-muted uppercase">Pendientes</div>
        </div>
      </div>

      {/* Entry cards */}
      {entries.map((entry) => {
        const config = ENTRY_TYPE_CONFIG[entry.entryType]
        const Icon = ENTRY_TYPE_ICON_MAP[config?.icon]
        const entryUrl = `/${config?.slug}/${entry.slug}`

        return (
          <div key={entry.id} className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg bg-elevated border border-border flex items-center justify-center shrink-0">
                {Icon && <Icon className="w-4 h-4 text-muted" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-2xs font-mono text-muted bg-elevated px-2 py-0.5 rounded-full">
                    {config?.label}
                  </span>
                  {entry._status === 'published' ? (
                    <span className="flex items-center gap-1 text-2xs font-mono text-accent">
                      <CheckCircle className="w-3 h-3" /> Publicado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-2xs font-mono text-secondary">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-primary text-sm">{entry.name}</h3>
                <p className="text-2xs text-muted font-mono">
                  {getCityName(entry.city)} · {timeAgo(entry.updatedAt)}
                </p>
                {entry.moderationNote && entry._status === 'draft' && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-400 flex items-start gap-1">
                    <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    {entry.moderationNote}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/dashboard/entries/${entry.id}`}
                  className={buttonVariants({ size: "sm" })}
                >
                  <Pencil className="w-3 h-3" /> Editar
                </Link>
                {entry._status === 'published' && (
                  <Link
                    href={entryUrl}
                    className={buttonVariants({ size: "sm" })}
                  >
                    <ExternalLink className="w-3 h-3" /> Ver
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      })}

      {/* Bottom action */}
      <div className="text-center pt-2">
        <Link
          href="/dashboard/entries/new"
          className={buttonVariants({ variant: "accent", size: "md" })}
        >
          <Plus className="w-3.5 h-3.5" />
          Agregar registro
        </Link>
      </div>
    </div>
  )
}
