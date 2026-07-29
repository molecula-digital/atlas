/** Client helper for authenticated uploads to Payload media (S3 / Cloudflare R2). */

export type UploadedMedia = {
  id: number
  url: string
}

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
    return `Tipo de archivo no válido. Usa: ${ALLOWED_MIME_TYPES.join(', ')}`
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'La imagen es demasiado grande. Máximo 5 MB.'
  }
  return null
}

/** Uploads one image and returns its media id + public URL. */
export async function uploadMediaFile(file: File): Promise<UploadedMedia> {
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  const formData = new FormData()
  formData.append('file', file)
  const res = await fetch('/api/media/upload', { method: 'POST', body: formData })
  const data = (await res.json().catch(() => ({}))) as {
    id?: number
    url?: string | null
    error?: string
  }

  if (!res.ok) {
    throw new Error(data.error || 'Error al subir imagen')
  }

  if (typeof data.id !== 'number' || !data.url) {
    throw new Error('La subida no devolvió una URL pública')
  }

  return { id: data.id, url: data.url }
}
