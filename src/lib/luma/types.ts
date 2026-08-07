/** Public Luma calendar/event shapes used by the sync client. */

export type LumaLocationType = 'offline' | 'online' | 'virtual' | string

export interface LumaGeoAddress {
  address?: string | null
  city?: string | null
  full_address?: string | null
  short_address?: string | null
  place_id?: string | null
  country?: string | null
  region?: string | null
  description?: string | null
  localized?: Record<
    string,
    {
      address?: string | null
      full_address?: string | null
      short_address?: string | null
      city?: string | null
    }
  >
}

export interface LumaEventSummary {
  api_id: string
  calendar_api_id: string
  name: string
  start_at: string
  end_at: string
  timezone: string
  url: string
  cover_url?: string | null
  location_type?: LumaLocationType | null
  geo_address_info?: LumaGeoAddress | null
  visibility?: string | null
  virtual_info?: { has_access?: boolean; meeting_url?: string | null } | null
}

export interface LumaHost {
  api_id?: string
  name?: string | null
  first_name?: string | null
  last_name?: string | null
}

export interface LumaCalendarRef {
  api_id: string
  name?: string | null
}

export interface LumaCalendarEntry {
  api_id: string
  status?: string | null
  platform?: string | null
  event: LumaEventSummary
  hosts?: LumaHost[]
  calendar?: LumaCalendarRef
}

export interface LumaCalendarItemsResponse {
  entries: LumaCalendarEntry[]
  has_more?: boolean
  next_cursor?: string | null
}

/** TipTap-style document returned as `description_mirror`. */
export interface LumaTipTapNode {
  type?: string
  text?: string
  content?: LumaTipTapNode[]
}

export interface LumaEventDetailResponse {
  event: LumaEventSummary
  hosts?: LumaHost[]
  calendar?: LumaCalendarRef
  description_mirror?: LumaTipTapNode | null
}

export type LumaListPeriod = 'future' | 'past'
