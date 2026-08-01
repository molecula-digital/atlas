import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3'
import { unstable_cache } from 'next/cache'
import { MEDIA_CDN_ORIGIN } from '@/lib/media-url'

/** CDN/bucket prefix the community photos live under. Drop a file here and it shows up. */
const COMMUNITY_PHOTO_PREFIX = 'public/community'

/** How long a bucket listing is reused before we ask R2 again. */
const LISTING_REVALIDATE_SECONDS = 60 * 60

/** Safety valve so one runaway prefix can't page through the whole bucket. */
const MAX_LIST_PAGES = 20

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
 * Authenticated client for listing only — R2 buckets are not publicly listable,
 * so the browser never touches this. Mirrors the storage config in payload.config.ts.
 */
function createS3Client(): S3Client | null {
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim()
  const endpoint = process.env.S3_ENDPOINT?.trim()

  if (!accessKeyId || !secretAccessKey || !endpoint) return null

  return new S3Client({
    credentials: { accessKeyId, secretAccessKey },
    endpoint,
    region: process.env.S3_REGION?.trim() || 'auto',
    forcePathStyle: true,
  })
}

type ListedObject = {
  key: string
  lastModified: number
}

/**
 * Every image object under the community prefix, newest first.
 *
 * Ordering is by LastModified rather than random so that paginated views stay
 * consistent between pages — a reshuffle per request would duplicate and drop photos.
 */
async function listCommunityObjects(): Promise<ListedObject[]> {
  const bucket = process.env.S3_BUCKET?.trim()
  const client = createS3Client()

  if (!bucket || !client) {
    console.warn('[community-photos] S3 is not configured; no photos will be listed.')
    return []
  }

  const objects: ListedObject[] = []
  let continuationToken: string | undefined
  let page = 0

  try {
    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          Prefix: `${COMMUNITY_PHOTO_PREFIX}/`,
          ContinuationToken: continuationToken,
        }),
      )

      for (const item of response.Contents ?? []) {
        // Skip the zero-byte marker some clients create for the folder itself.
        if (!item.Key || !IMAGE_EXT.test(item.Key) || !item.Size) continue
        objects.push({
          key: item.Key,
          lastModified: item.LastModified?.getTime() ?? 0,
        })
      }

      continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
      page += 1
    } while (continuationToken && page < MAX_LIST_PAGES)
  } catch (error) {
    console.error('[community-photos] Failed to list community photos:', error)
    return []
  } finally {
    client.destroy()
  }

  return objects.sort((a, b) => b.lastModified - a.lastModified)
}

const listCommunityObjectsCached = unstable_cache(
  listCommunityObjects,
  ['community-photos-listing'],
  { revalidate: LISTING_REVALIDATE_SECONDS, tags: ['community-photos'] },
)

function toPhoto({ key }: ListedObject): CommunityPhoto {
  const file = key.slice(key.lastIndexOf('/') + 1)

  return {
    src: `${MEDIA_CDN_ORIGIN}/${key}`,
    alt: photoAlt(file),
  }
}

/**
 * Community photos in a stable newest-first order, served from the CDN
 * (`cdn.atlas-sinaloa.tech/public/community/`). Use this anywhere order matters,
 * such as the paginated gallery. Upload a file to the bucket under that prefix
 * and it appears within the cache window — no code change needed.
 */
export async function getCommunityPhotosOrdered(): Promise<CommunityPhoto[]> {
  const objects = await listCommunityObjectsCached()
  return objects.map(toPhoto)
}

/**
 * A randomized slice for the marquee on the home page. Capped so the carousel
 * stays light no matter how large the bucket grows.
 */
export async function getCommunityPhotos(limit = 24): Promise<CommunityPhoto[]> {
  const objects = await listCommunityObjectsCached()
  return shuffle(objects).slice(0, limit).map(toPhoto)
}
