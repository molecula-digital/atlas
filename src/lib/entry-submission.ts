import { isStartupLike, type AtlasEntryType } from '@/config'
import { uploadMediaFile } from '@/lib/media-upload'

/** The editable entry fields, as the forms hold them (all strings, as typed). */
export interface EntryFormValues {
  name: string
  tagline: string
  body: string
  city: string
  website: string
  x: string
  instagram: string
  linkedin: string
  github: string
  youtube: string
  discord: string
  telegram: string
  tags: string[]
  // startup-like
  foundedYear: string
  stage: string
  teamSize: string
  sector: string
  technologies: string
  hiring: boolean
  hiringUrl: string
  businessModel: string
  // community
  memberCount: string
  meetupFrequency: string
  // person
  role: string
  company: string
  email: string
  portfolio: string
  availableForHire: boolean
  availableForMentoring: boolean
}

export function csvToArray(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

/**
 * Builds the entries API payload from form values.
 *
 * Create and edit each had their own copy of this and had already drifted —
 * hiringUrl was submitted from a hidden field on create but not on edit. Only
 * the fields that belong to the entry type are sent.
 */
export function toEntrySubmission(
  values: EntryFormValues,
  entryType: AtlasEntryType,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    name: values.name,
    tagline: values.tagline || undefined,
    city: values.city,
    website: values.website || undefined,
    x: values.x || undefined,
    instagram: values.instagram || undefined,
    linkedin: values.linkedin || undefined,
    github: values.github || undefined,
    youtube: values.youtube || undefined,
    tags:
      values.tags.length > 0 ? values.tags.map((tag) => ({ tag })) : undefined,
    body: values.body.trim() || undefined,
  }

  if (isStartupLike(entryType)) {
    payload.foundedYear = values.foundedYear
      ? Number(values.foundedYear)
      : undefined
    payload.stage = values.stage || undefined
    payload.teamSize = values.teamSize || undefined
    payload.sector = values.sector || undefined
    const techs = csvToArray(values.technologies)
    payload.technologies =
      techs.length > 0 ? techs.map((technology) => ({ technology })) : undefined
    // The checkbox is a UI gate: a URL left behind after unchecking is not sent.
    payload.hiringUrl =
      values.hiring && values.hiringUrl ? values.hiringUrl : undefined
    payload.businessModel = values.businessModel || undefined
  }

  if (entryType === 'community') {
    payload.memberCount = values.memberCount
      ? Number(values.memberCount)
      : undefined
    payload.meetupFrequency = values.meetupFrequency || undefined
    payload.discord = values.discord || undefined
    payload.telegram = values.telegram || undefined
  }

  if (entryType === 'person') {
    payload.role = values.role || undefined
    payload.company = values.company || undefined
    payload.email = values.email || undefined
    payload.portfolio = values.portfolio || undefined
    payload.availableForHire = values.availableForHire
    payload.availableForMentoring = values.availableForMentoring
  }

  return payload
}

/** Uploads one image and returns its media id. Shared by create and edit. */
export async function uploadEntryImage(file: File): Promise<number> {
  const media = await uploadMediaFile(file)
  return media.id
}
