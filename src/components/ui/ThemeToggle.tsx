'use client'

import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import { useDisclosure } from '@/hooks/useDisclosure'

const OPTIONS = [
  { value: 'light', label: 'Claro', Icon: Sun },
  { value: 'dark', label: 'Oscuro', Icon: Moon },
  { value: 'system', label: 'Sistema', Icon: Monitor },
] as const

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { open, setOpen, ref, toggle } = useDisclosure()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const ActiveIcon = mounted
    ? (OPTIONS.find((o) => o.value === theme)?.Icon ?? Monitor)
    : Monitor

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggle() }}
        aria-label="Cambiar tema"
        aria-haspopup="true"
        aria-expanded={open}
        className="p-1 min-h-8 min-w-8 flex items-center justify-center text-secondary hover:text-accent transition-all duration-200 rounded hover:bg-elevated"
      >
        <ActiveIcon className="w-3 h-3" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-40 p-1 bg-card border border-border rounded-lg shadow-xl z-50">
          {OPTIONS.map(({ value, label, Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => { setTheme(value); setOpen(false) }}
              className="w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-xs font-mono text-secondary hover:text-accent hover:bg-elevated transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
              {theme === value && <Check className="w-3 h-3 ml-auto text-accent" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
