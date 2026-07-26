import type { Event, Media } from '@/payload-types'

export interface TechEvent {
  id: string
  slug: string
  title: string
  organizer: string
  date: string
  startTime: string
  endTime: string
  description: string
  url: string
  location: string
  mapsUrl: string
  modality: string
  isInPerson: boolean
  meetLink: string
  image?: string | null
  registerUrl: string
}

export function getEventPath(slug: string): string {
  return `/eventos/${slug}`
}

function getImageUrl(image: Event['image']): string | null {
  if (typeof image === 'object' && image !== null && (image as Media).url) {
    return (image as Media).url ?? null
  }
  return null
}

function lexicalToPlainText(data: Event['description']): string {
  if (!data?.root?.children) return ''
  function extractText(node: { text?: string; children?: unknown[] }): string {
    if (typeof node.text === 'string') return node.text
    if (Array.isArray(node.children)) {
      return node.children
        .map((child) => extractText(child as { text?: string; children?: unknown[] }))
        .join('')
    }
    return ''
  }
  return data.root.children
    .map((child) => extractText(child as { text?: string; children?: unknown[] }))
    .join('\n')
    .trim()
}

function formatTimeField(value: string | null | undefined): string {
  if (!value) return ''
  if (value.includes('T')) {
    const date = new Date(value)
    const h = date.getUTCHours()
    const m = date.getUTCMinutes()
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
  }
  return value
}

export function eventDocToTechEvent(doc: Event): TechEvent {
  const date = (doc.date || '').split('T')[0]
  const fallbackSlug = doc.title
    ? `${doc.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')}${date ? `-${date}` : ''}`
    : String(doc.id)

  return {
    id: String(doc.id),
    slug: (doc as Event & { slug?: string }).slug || fallbackSlug,
    title: doc.title,
    organizer: doc.organizer || '',
    date: (doc.date || '').split('T')[0],
    startTime: formatTimeField(doc.startTime),
    endTime: formatTimeField(doc.endTime),
    description: lexicalToPlainText(doc.description),
    url: doc.url || '',
    location: doc.location || '',
    mapsUrl: doc.mapsUrl || '',
    modality: doc.modality || 'in-person',
    isInPerson: doc.modality === 'in-person',
    meetLink: doc.meetLink || '',
    image: getImageUrl(doc.image),
    registerUrl: doc.registerUrl || '',
  }
}

export function groupEventsByDate(events: TechEvent[]): Record<string, TechEvent[]> {
  const map: Record<string, TechEvent[]> = {}
  for (const ev of events) {
    const dateKey = ev.date?.split('T')[0]
    if (!dateKey) continue
    if (!map[dateKey]) map[dateKey] = []
    map[dateKey].push(ev)
  }
  return map
}
