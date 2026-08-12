'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown, Layers } from 'lucide-react'
import { SECTOR_OPTIONS } from '@/config'
import { SECTOR_ICON_MAP } from '@/lib/sector-icons'
import { cn } from '@/lib/utils'

interface SectorMultiSelectProps {
  selected: string[]
  onChange: (sectors: string[]) => void
}

/**
 * Multi-select dropdown for Payload `sector` values (Fintech, HealthTech, …).
 * Keeps selection local to the trigger; parent owns URL + fetch state.
 */
export function SectorMultiSelect({
  selected,
  onChange,
}: SectorMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value))
    } else {
      onChange([...selected, value])
    }
  }

  const label =
    selected.length === 0
      ? 'Todos los sectores'
      : selected.length === 1
        ? selected[0]
        : `${selected.length} sectores`

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full cursor-pointer items-center justify-between gap-2 rounded border border-border bg-elevated/40 px-3 py-2 text-left transition-colors hover:bg-elevated',
          selected.length > 0 && 'border-accent/40 bg-accent/5',
        )}
      >
        <span className="flex min-w-0 items-center gap-2">
          <Layers
            className={cn(
              'h-4 w-4 shrink-0',
              selected.length > 0 ? 'text-accent' : 'text-muted',
            )}
            aria-hidden="true"
          />
          <span
            className={cn(
              'truncate text-xs',
              selected.length > 0 ? 'font-medium text-accent' : 'text-primary',
            )}
          >
            {label}
          </span>
        </span>
        <ChevronDown
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-muted transition-transform',
            open && 'rotate-180',
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border border-border bg-card py-1 shadow-lg"
        >
          {SECTOR_OPTIONS.map((opt) => {
            const Icon = SECTOR_ICON_MAP[opt.value]
            const isSelected = selected.includes(opt.value)
            return (
              <li key={opt.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => toggle(opt.value)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-elevated',
                    isSelected && 'bg-accent/10',
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isSelected ? 'text-accent' : 'text-muted',
                    )}
                    aria-hidden="true"
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-xs',
                      isSelected ? 'font-medium text-accent' : 'text-primary',
                    )}
                  >
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check
                      className="h-3.5 w-3.5 shrink-0 text-accent"
                      aria-hidden="true"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
