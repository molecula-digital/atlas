import { MEDIA_CDN_ORIGIN } from '@/lib/media-url'

const COMMUNITY_PHOTO_PREFIX = 'public/community'

/**
 * Filenames uploaded to the CDN under `public/community/`.
 * Add a name here when you upload a new photo — same filename on the CDN.
 */
const COMMUNITY_PHOTO_FILES = [
  'IMG_3137.jpeg',
  'IMG_3781.jpeg',
  'IMG_3783.jpeg',
  'IMG_3784.jpeg',
  'IMG_3817.jpeg',
  'IMG_4956.jpeg',
  'IMG_4958.jpeg',
  'IMG_4966.jpeg',
  'IMG_4981.jpeg',
  'IMG_5307.jpeg',
  'IMG_5310.jpeg',
  'IMG_5314.jpeg',
  'IMG_5318.jpeg',
  'IMG_6400.jpeg',
  'IMG_6406.jpeg',
  'IMG_6408.jpeg',
  'IMG_6409.jpeg',
] as const

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|avif)$/i

/** Returns a new randomized copy without changing the source list. */
function shuffle<T>(items: readonly T[]): T[] {
  const shuffled = [...items]

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex]!,
      shuffled[index]!,
    ]
  }

  return shuffled
}

export type CommunityPhoto = {
  src: string
  alt: string
}

function photoAlt(file: string): string {
  const label = file
    .replace(IMAGE_EXT, '')
    .replace(/[-_]+/g, ' ')
    .trim()

  return label
    ? `Comunidad Tech Atlas — ${label}`
    : 'Foto de la comunidad Tech Atlas'
}

/**
 * Community photos served from the CDN (`cdn.atlas-sinaloa.tech/public/community/`).
 * Upload files there with the same names, then add the filename to `COMMUNITY_PHOTO_FILES`.
 */
export async function getCommunityPhotos(): Promise<CommunityPhoto[]> {
  return shuffle(COMMUNITY_PHOTO_FILES).map((file) => ({
    src: `${MEDIA_CDN_ORIGIN}/${COMMUNITY_PHOTO_PREFIX}/${file}`,
    alt: photoAlt(file),
  }))
}
