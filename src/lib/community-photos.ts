import { readdir } from 'node:fs/promises'
import path from 'node:path'

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

/**
 * Reads community photos from `public/community/`.
 * Drop image files there (jpg, png, webp, gif, avif) — they appear on the homepage carousel automatically.
 */
export async function getCommunityPhotos(): Promise<CommunityPhoto[]> {
  const dir = path.join(process.cwd(), 'public', 'community')

  try {
    const files = await readdir(dir)
    return shuffle(
      files.filter((file) => IMAGE_EXT.test(file) && !file.startsWith('.')),
    )
      .map((file) => {
        const label = file
          .replace(IMAGE_EXT, '')
          .replace(/[-_]+/g, ' ')
          .trim()

        return {
          src: `/community/${file}`,
          alt: label
            ? `Comunidad Tech Atlas — ${label}`
            : 'Foto de la comunidad Tech Atlas',
        }
      })
  } catch {
    return []
  }
}
