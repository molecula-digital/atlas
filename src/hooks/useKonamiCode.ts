'use client'

import { useEffect } from 'react'

const KONAMI_SEQUENCE = [
  'ArrowUp',
  'ArrowUp',
  'ArrowDown',
  'ArrowDown',
  'ArrowLeft',
  'ArrowRight',
  'ArrowLeft',
  'ArrowRight',
  'b',
  'a',
] as const

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  if (target.isContentEditable) return true
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT'
}

function normalizeKey(key: string) {
  return key.length === 1 ? key.toLowerCase() : key
}

export function useKonamiCode(onMatch: () => void) {
  useEffect(() => {
    let position = 0

    function resetTo(key: string) {
      position = normalizeKey(key) === KONAMI_SEQUENCE[0] ? 1 : 0
    }

    function onKeyDown(event: KeyboardEvent) {
      if (isTypingTarget(event.target)) return

      const key = normalizeKey(event.key)
      const expected = KONAMI_SEQUENCE[position]

      if (key === expected) {
        position += 1
        if (position === KONAMI_SEQUENCE.length) {
          position = 0
          onMatch()
        }
        return
      }

      resetTo(key)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onMatch])
}
