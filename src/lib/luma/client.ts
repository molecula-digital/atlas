import type {
  LumaCalendarItemsResponse,
  LumaEventDetailResponse,
  LumaListPeriod,
} from './types'

const LUMA_API_BASE = 'https://api.lu.ma'

export class LumaApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: string,
  ) {
    super(message)
    this.name = 'LumaApiError'
  }
}

async function lumaFetch<T>(
  path: string,
  params: Record<string, string | undefined>,
): Promise<T> {
  const url = new URL(path, LUMA_API_BASE)
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, value)
  }

  const res = await fetch(url, {
    headers: { Accept: 'application/json' },
    // Calendar feeds change; never serve a stale Next fetch cache.
    cache: 'no-store',
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new LumaApiError(
      `Luma API ${res.status} for ${url.pathname}`,
      res.status,
      body.slice(0, 500),
    )
  }

  return (await res.json()) as T
}

export async function listCalendarItems(options: {
  calendarId: string
  period: LumaListPeriod
  paginationLimit?: number
  paginationCursor?: string
}): Promise<LumaCalendarItemsResponse> {
  const { calendarId, period, paginationLimit = 50, paginationCursor } = options

  return lumaFetch<LumaCalendarItemsResponse>('/calendar/get-items', {
    calendar_api_id: calendarId,
    period,
    pagination_limit: String(paginationLimit),
    pagination_cursor: paginationCursor,
  })
}

/**
 * Walk every page for a period. Luma returns at most ~50 items per page;
 * past calendars can grow without bound so the caller should set a sane cap.
 */
export async function listAllCalendarItems(options: {
  calendarId: string
  period: LumaListPeriod
  maxPages?: number
  paginationLimit?: number
}): Promise<LumaCalendarItemsResponse['entries']> {
  const { calendarId, period, maxPages = 20, paginationLimit = 50 } = options
  const entries: LumaCalendarItemsResponse['entries'] = []
  let cursor: string | undefined
  let pages = 0

  while (pages < maxPages) {
    const page = await listCalendarItems({
      calendarId,
      period,
      paginationLimit,
      paginationCursor: cursor,
    })
    entries.push(...(page.entries ?? []))
    pages += 1
    if (!page.has_more || !page.next_cursor) break
    cursor = page.next_cursor
  }

  return entries
}

export async function getEventDetail(
  eventId: string,
): Promise<LumaEventDetailResponse> {
  return lumaFetch<LumaEventDetailResponse>('/event/get', {
    event_api_id: eventId,
  })
}
