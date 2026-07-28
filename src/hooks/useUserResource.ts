'use client'

import { useState, useEffect } from 'react'
import { readJson } from '@/lib/read-json'

/**
 * Fetches a `{ docs: T[] }` endpoint for the signed-in user.
 * A failed request surfaces as `error` — never as an empty list, which callers
 * would otherwise render as "you haven't created anything yet".
 */
export function useUserResource<T>(url: string) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(url)
        const parsed = await readJson<{ docs?: T[] }>(res)
        if (cancelled) return
        if (!res.ok || !parsed.ok) {
          setError(parsed.ok ? `Error del servidor (${res.status})` : parsed.error)
          return
        }
        setData(parsed.data.docs ?? [])
      } catch {
        if (!cancelled) setError('No se pudo conectar con el servidor')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [url])

  return { data, loading, error }
}
