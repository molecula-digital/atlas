'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { Event } from '@/payload-types'
import {
  eventDocToTechEvent,
  groupEventsByDate,
  type TechEvent,
} from '@/lib/events'

export type { TechEvent } from '@/lib/events'

type Status = 'idle' | 'loading' | 'fresh' | 'error'

export interface UseEventsDataResult {
  events: TechEvent[]
  eventsByDate: Record<string, TechEvent[]>
  status: Status
  refetch: () => void
}

export function useEventsData(): UseEventsDataResult {
  const [events, setEvents] = useState<TechEvent[]>([])
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events])
  // Start idle so SSR HTML matches the first client render (avoids disabled/spinner mismatches).
  // Fetch kicks off in useEffect and flips to loading.
  const [status, setStatus] = useState<Status>('idle')

  const fetchEvents = useCallback(async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/directory/events?limit=200')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: { docs: Event[] } = await res.json()
      const docs: TechEvent[] = (data.docs || []).map(eventDocToTechEvent)
      setEvents(docs)
      setStatus('fresh')
    } catch {
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void Promise.resolve().then(fetchEvents)
  }, [fetchEvents])

  return { events, eventsByDate, status, refetch: fetchEvents }
}
