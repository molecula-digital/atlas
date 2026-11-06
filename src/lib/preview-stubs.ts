import type { CommunityPhoto } from '@/lib/community-photos'
import type { TechEvent } from '@/lib/events'

/** Local-only stand-ins so an empty database still previews the landing. */
export function isPreviewStubEnabled() {
  return process.env.NODE_ENV !== 'production'
}

export const STUB_COMMUNITY_PHOTOS: CommunityPhoto[] = [
  {
    src: '/preview/community-1.jpg',
    alt: 'Meetup de la comunidad Tech Atlas en Culiacán',
  },
  {
    src: '/preview/community-2.jpg',
    alt: 'Taller de IA de la comunidad Tech Atlas',
  },
  {
    src: '/preview/community-3.jpg',
    alt: 'Encuentro de la comunidad Tech Atlas en Mazatlán',
  },
  {
    src: '/preview/community-4.jpg',
    alt: 'Demo night de la comunidad Tech Atlas',
  },
  {
    src: '/preview/community-5.jpg',
    alt: 'Hack night de la comunidad Tech Atlas',
  },
  {
    src: '/preview/community-6.jpg',
    alt: 'After del meetup de Tech Atlas',
  },
]

function isoDateFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const STUB_UPCOMING_EVENTS: TechEvent[] = [
  {
    id: 'preview-meetup-culiacan',
    slug: 'preview-meetup-culiacan',
    title: 'Meetup Culiacán: construir en público',
    organizer: 'Tech Atlas',
    date: isoDateFromNow(5),
    startTime: '7:00 PM',
    endTime: '9:00 PM',
    description:
      'Pláticas cortas y conversación de la comunidad tech de Sinaloa.',
    url: '/eventos',
    location: 'Culiacán',
    mapsUrl: '',
    modality: 'Presencial',
    isInPerson: true,
    meetLink: '',
    image: '/preview/community-1.jpg',
    registerUrl: '',
  },
  {
    id: 'preview-taller-ia',
    slug: 'preview-taller-ia',
    title: 'Taller de IA aplicada',
    organizer: 'Tech Atlas',
    date: isoDateFromNow(12),
    startTime: '6:00 PM',
    endTime: '8:30 PM',
    description: 'Un taller práctico para gente que ya está construyendo.',
    url: '/eventos',
    location: 'Mazatlán',
    mapsUrl: '',
    modality: 'Presencial',
    isInPerson: true,
    meetLink: '',
    image: '/preview/community-2.jpg',
    registerUrl: '',
  },
  {
    id: 'preview-demo-night',
    slug: 'preview-demo-night',
    title: 'Demo night del ecosistema',
    organizer: 'Tech Atlas',
    date: isoDateFromNow(19),
    startTime: '7:30 PM',
    endTime: '10:00 PM',
    description:
      'Startups y proyectos del estado muestran lo que están haciendo.',
    url: '/eventos',
    location: 'En línea',
    mapsUrl: '',
    modality: 'En línea',
    isInPerson: false,
    meetLink: '',
    image: '/preview/community-4.jpg',
    registerUrl: '',
  },
]
