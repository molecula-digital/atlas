/** Client helper for authenticated uploads to Payload media (S3 / Cloudflare R2). */

import { ANALYTICS_EVENTS } from '@/lib/analytics-events'
import { captureRequestFailed } from '@/lib/analytics'

export type UploadedMedia = {
  id: number
  url: string
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export function validateImageFile(file: File): string | null {
  if (
    !ALLOWED_MIME_TYPES.includes(
      file.type as (typeof ALLOWED_MIME_TYPES)[number],
    )
  ) {
    return `Tipo de archivo no válido. Usa: ${ALLOWED_MIME_TYPES.join(', ')}`
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'La imagen es demasiado grande. Máximo 5 MB.'
  }
  return null
}

/**
 * Uploads one image and returns its media id + public URL.
 *
 * Every image in the app goes through here, so this is also where upload
 * failures are reported. It matters because a failed upload aborts the
 * submission that contained it: without this, a wizard drop-off caused by a
 * rejected logo is indistinguishable from someone simply changing their mind.
 */
export async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const validationError = validateImageFile(file)
  if (validationError) {
    // Rejected before any request — recorded so the size and type limits can be
    // judged against how often they actually turn people away.
    captureRequestFailed(
      ANALYTICS_EVENTS.mediaUploadFailed,
      { status: null, reason: validationError, kind: 'validation' },
      { stage: 'validation', file_type: file.type, file_size: file.size },
    )
    throw new Error(validationError)
  }

  const formData = new FormData()
  formData.append('file', file)

  const uploadProps = {
    stage: 'request',
    file_type: file.type,
    file_size: file.size,
  }

  let res: Response
  try {
    res = await fetch('/api/media/upload', { method: 'POST', body: formData })
  } catch (err) {
    captureRequestFailed(
      ANALYTICS_EVENTS.mediaUploadFailed,
      { status: null },
      uploadProps,
    )
    throw err
  }

  const data = (await res.json().catch(() => ({}))) as {
    id?: number
    url?: string | null
    error?: string
  }

  if (!res.ok) {
    captureRequestFailed(
      ANALYTICS_EVENTS.mediaUploadFailed,
      { status: res.status, reason: data.error ?? null },
      uploadProps,
    )
    throw new Error(data.error || 'Error al subir imagen')
  }

  if (typeof data.id !== 'number' || !data.url) {
    captureRequestFailed(
      ANALYTICS_EVENTS.mediaUploadFailed,
      { status: res.status, reason: 'missing_public_url' },
      uploadProps,
    )
    throw new Error('La subida no devolvió una URL pública')
  }

  return { id: data.id, url: data.url }
}
