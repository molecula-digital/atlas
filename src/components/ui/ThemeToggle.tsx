'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Contrast, Check } from 'lucide-react'
import { useDisclosure } from '@/hooks/useDisclosure'
import { cn } from '@/lib/utils'

// `Contrast` — a half-filled disc — stands in for "follow the system", which
// reads as light/dark duality rather than a device.
const OPTIONS = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Contrast },
] as const

export default function ThemeToggle({
  className = '',
}: {
  className?: string
}) {
  const { theme, setTheme } = useTheme()
  const { open, setOpen, ref, toggle } = useDisclosure()
  const [mounted, setMounted] = useState(false)
  // Bumped on every pick; remounting the icon under a new key replays the
  // CSS animation. Starts at 0 so the first paint stays still.
  const [swapCount, setSwapCount] = useState(0)

  useEffect(() => setMounted(true), [])

  const ActiveIcon = mounted
    ? (OPTIONS.find((o) => o.value === theme)?.Icon ?? Contrast)
    : Contrast

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          toggle()
        }}
        aria-label="Cambiar tema"
        aria-haspopup="true"
        aria-expanded={open}
        className="group relative flex min-h-8 min-w-8 cursor-pointer items-center justify-center text-secondary hover:text-accent transition-colors duration-200"
      >
        {/*
          The header row is h-8 and so is this button, so a background on the
          button itself would run edge to edge. The hover fill is inset instead,
          which keeps the full 32px tap target.
        */}
        <span
          aria-hidden
          className="absolute inset-1 rounded transition-colors duration-200 group-hover:bg-elevated"
        />
        <ActiveIcon
          key={swapCount}
          className={cn('relative w-3 h-3', swapCount && 'animate-theme-icon')}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 p-1 bg-card border border-border rounded-lg shadow-xl z-50">
          {OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setTheme(value)
                setOpen(false)
                setSwapCount((n) => n + 1)
              }}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-xs font-mono text-secondary hover:text-accent hover:bg-elevated transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
              {theme === value && (
                <Check className="w-3 h-3 ml-auto text-accent" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
