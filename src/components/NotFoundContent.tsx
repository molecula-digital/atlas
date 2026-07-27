'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FolderOpen, CalendarDays, Newspaper, Briefcase, ArrowLeft } from 'lucide-react'
import { btn } from '@/components/ui/button-styles'

const LINES = [
  '> buscando página...',
  '> no encontramos lo que buscas',
  '> te puede interesar:',
]

const CHAR_DELAY = 40
const LINE_PAUSE = 400

const NAV_LINKS = [
  { href: '/directorio', label: 'Directorio', icon: FolderOpen },
  { href: '/eventos', label: 'Eventos', icon: CalendarDays },
  { href: '/noticias', label: 'Noticias', icon: Newspaper },
  { href: '/empleos', label: 'Empleos', icon: Briefcase },
]

export function NotFoundContent() {
  const [displayedLines, setDisplayedLines] = useState<string[]>([])
  const [currentLine, setCurrentLine] = useState(0)
  const [currentChar, setCurrentChar] = useState(0)
  const [showLinks, setShowLinks] = useState(false)
  const typing = currentLine < LINES.length

  useEffect(() => {
    if (currentLine >= LINES.length) {
      const timer = setTimeout(() => setShowLinks(true), 300)
      return () => clearTimeout(timer)
    }

    const line = LINES[currentLine]

    if (currentChar < line.length) {
      const timer = setTimeout(() => {
        setDisplayedLines((prev) => {
          const updated = [...prev]
          updated[currentLine] = line.slice(0, currentChar + 1)
          return updated
        })
        setCurrentChar((c) => c + 1)
      }, CHAR_DELAY)
      return () => clearTimeout(timer)
    }

    // Line complete — pause then move to next
    const timer = setTimeout(() => {
      setCurrentLine((l) => l + 1)
      setCurrentChar(0)
      setDisplayedLines((prev) => [...prev, ''])
    }, LINE_PAUSE)
    return () => clearTimeout(timer)
  }, [currentLine, currentChar])

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
      {/* Terminal window */}
      <div className="w-full max-w-2xl rounded-lg border border-border bg-card shadow-lg overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-elevated">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-2 text-xs font-mono text-muted">tech_atlas</span>
        </div>

        {/* Terminal body */}
        <div className="p-6 font-mono text-sm min-h-[200px]">
          {/* 404 heading */}
          <p className="text-accent font-bold text-lg mb-4">404</p>

          {/* Typed lines */}
          {displayedLines.map((line, i) => (
            <p key={LINES[i] ?? i} className="text-secondary leading-relaxed">
              {line}
              {typing && i === currentLine && (
                <span aria-hidden="true" className="animate-pulse text-accent">▌</span>
              )}
            </p>
          ))}

          {/* Cursor on empty state */}
          {displayedLines.length === 0 && typing && (
            <p className="text-secondary">
              <span aria-hidden="true" className="animate-pulse text-accent">▌</span>
            </p>
          )}

          {/* Navigation links */}
          <div
            className={`mt-6 grid grid-cols-2 gap-3 transition-opacity duration-300 ${
              showLinks ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {NAV_LINKS.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={btn({ size: 'md' }, 'justify-start')}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Back to home */}
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-sm font-mono text-muted hover:text-accent transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver al inicio
      </Link>
    </div>
  )
}
