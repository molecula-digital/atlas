import type { Payload, Where } from 'payload'
import type { Event } from '@/payload-types'
import { getEventDetail, listAllCalendarItems } from './client'
import { mapLumaEventToPayload, type MappedLumaEvent } from './map'
import type { LumaListPeriod } from './types'

export interface LumaCalendarConfig {
  id: number | string
  name: string
  calendarId: string
  enabled?: boolean | null
  syncPast?: boolean | null
  autoPublish?: boolean | null
}

export interface CalendarSyncResult {
  calendarId: string
  name: string
  created: number
  updated: number
  skipped: number
  failed: number
  errors: string[]
}

export interface SyncAllResult {
  calendars: CalendarSyncResult[]
  totals: {
    created: number
    updated: number
    skipped: number
    failed: number
  }
}

type EventWriteData = {
  title: string
  slug: string
  organizer?: string | null
  description?: Event['description']
  date: string
  startTime?: string | null
  endTime?: string | null
  location?: string | null
  mapsUrl?: string | null
  modality: Event['modality']
  meetLink?: string | null
  url?: string | null
  registerUrl?: string | null
  externalImageUrl?: string | null
  externalSource?: Event['externalSource']
  externalId?: string | null
  externalCalendarId?: string | null
  externalCalendarName?: string | null
  lastSyncedAt?: string | null
  syncLocked?: boolean | null
  _status?: Event['_status']
}

function emptyResult(calendarId: string, name: string): CalendarSyncResult {
  return {
    calendarId,
    name,
    created: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  }
}

async function findExistingByExternalId(payload: Payload, externalId: string) {
  const result = await payload.find({
    collection: 'events',
    where: {
      and: [
        { externalSource: { equals: 'luma' } },
        { externalId: { equals: externalId } },
      ],
    } satisfies Where,
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

function toEventData(
  mapped: MappedLumaEvent,
  autoPublish: boolean,
  calendarName?: string,
): EventWriteData {
  return {
    title: mapped.title,
    slug: mapped.slug,
    organizer: mapped.organizer || null,
    description: mapped.description,
    date: mapped.date,
    startTime: mapped.startTime,
    endTime: mapped.endTime,
    location: mapped.location || null,
    mapsUrl: mapped.mapsUrl || null,
    modality: mapped.modality,
    meetLink: mapped.meetLink || null,
    url: mapped.url || null,
    registerUrl: mapped.registerUrl || null,
    externalImageUrl: mapped.externalImageUrl || null,
    externalSource: mapped.externalSource,
    externalId: mapped.externalId,
    externalCalendarId: mapped.externalCalendarId,
    externalCalendarName:
      calendarName?.trim() || mapped.externalCalendarName || null,
    lastSyncedAt: new Date().toISOString(),
    _status: autoPublish ? 'published' : 'draft',
  }
}

async function upsertMappedEvent(
  payload: Payload,
  mapped: MappedLumaEvent,
  autoPublish: boolean,
  result: CalendarSyncResult,
  calendarName?: string,
): Promise<void> {
  const existing = await findExistingByExternalId(payload, mapped.externalId)

  if (existing?.syncLocked) {
    result.skipped += 1
    return
  }

  if (existing) {
    // Preserve the existing slug so public URLs stay stable across renames.
    const data = toEventData(mapped, autoPublish, calendarName)
    data.slug = existing.slug
    await payload.update({
      collection: 'events',
      id: existing.id,
      data,
      draft: false,
      overrideAccess: true,
      context: { lumaSync: true },
    })
    result.updated += 1
    return
  }

  await payload.create({
    collection: 'events',
    data: {
      ...toEventData(mapped, autoPublish, calendarName),
      syncLocked: false,
    },
    draft: !autoPublish,
    overrideAccess: true,
    context: { lumaSync: true },
  })
  result.created += 1
}

async function collectEntriesForCalendar(
  calendarId: string,
  syncPast: boolean,
) {
  const periods: LumaListPeriod[] = syncPast ? ['future', 'past'] : ['future']
  const byEventId = new Map<
    string,
    Awaited<ReturnType<typeof listAllCalendarItems>>[number]
  >()

  for (const period of periods) {
    const entries = await listAllCalendarItems({
      calendarId,
      period,
      // Past calendars can be large; 20 pages × 50 ≈ 1000 events.
      maxPages: period === 'past' ? 20 : 10,
    })
    for (const entry of entries) {
      // Only approved (or missing status) public listings.
      if (entry.status && entry.status !== 'approved') continue
      const eventId = entry.event?.api_id
      if (!eventId) continue
      byEventId.set(eventId, entry)
    }
  }

  return [...byEventId.values()]
}

export async function syncLumaCalendar(
  payload: Payload,
  calendar: LumaCalendarConfig,
): Promise<CalendarSyncResult> {
  const result = emptyResult(calendar.calendarId, calendar.name)
  const autoPublish = calendar.autoPublish !== false
  const syncPast = calendar.syncPast !== false

  let entries
  try {
    entries = await collectEntriesForCalendar(calendar.calendarId, syncPast)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    result.failed += 1
    result.errors.push(`list failed: ${message}`)
    return result
  }

  for (const entry of entries) {
    const eventId = entry.event.api_id
    try {
      const detail = await getEventDetail(eventId)
      // Prefer hosts from the list entry when detail omits them.
      if ((!detail.hosts || detail.hosts.length === 0) && entry.hosts?.length) {
        detail.hosts = entry.hosts
      }
      if (!detail.calendar && entry.calendar) {
        detail.calendar = entry.calendar
      }
      const mapped = mapLumaEventToPayload(detail, {
        fallbackCalendarId: calendar.calendarId,
      })
      await upsertMappedEvent(
        payload,
        mapped,
        autoPublish,
        result,
        calendar.name,
      )
    } catch (err) {
      result.failed += 1
      const message = err instanceof Error ? err.message : String(err)
      result.errors.push(`${eventId}: ${message}`)
    }
  }

  const statusParts = [
    `created=${result.created}`,
    `updated=${result.updated}`,
    `skipped=${result.skipped}`,
    `failed=${result.failed}`,
  ]
  if (result.errors.length) {
    statusParts.push(`errors=${result.errors.slice(0, 3).join('; ')}`)
  }

  try {
    await payload.update({
      collection: 'luma-calendars',
      id: calendar.id,
      data: {
        lastSyncedAt: new Date().toISOString(),
        lastSyncStatus: statusParts.join(', '),
      },
      overrideAccess: true,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    result.errors.push(`status update failed: ${message}`)
  }

  return result
}

export async function syncAllEnabledLumaCalendars(
  payload: Payload,
  options?: { calendarIds?: string[] },
): Promise<SyncAllResult> {
  const where: Where = options?.calendarIds?.length
    ? {
        and: [
          { enabled: { equals: true } },
          { calendarId: { in: options.calendarIds } },
        ],
      }
    : { enabled: { equals: true } }

  const found = await payload.find({
    collection: 'luma-calendars',
    where,
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  const calendars: CalendarSyncResult[] = []
  for (const doc of found.docs) {
    const result = await syncLumaCalendar(payload, {
      id: doc.id,
      name: doc.name,
      calendarId: doc.calendarId,
      enabled: doc.enabled,
      syncPast: doc.syncPast,
      autoPublish: doc.autoPublish,
    })
    calendars.push(result)
  }

  const totals = calendars.reduce(
    (acc, c) => ({
      created: acc.created + c.created,
      updated: acc.updated + c.updated,
      skipped: acc.skipped + c.skipped,
      failed: acc.failed + c.failed,
    }),
    { created: 0, updated: 0, skipped: 0, failed: 0 },
  )

  return { calendars, totals }
}
