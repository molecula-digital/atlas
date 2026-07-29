import { NextResponse } from 'next/server'
import { getServerSession } from '@/lib/auth-helpers'
import { getPayloadClient } from '@/lib/payload'
import { toPublicMediaUrl } from '@/lib/media-url'

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  const session = await getServerSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}` },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is 5 MB.` },
        { status: 400 },
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())

    const payload = await getPayloadClient()
    const media = await payload.create({
      collection: 'media',
      data: { alt: file.name },
      file: {
        data: buffer,
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      overrideAccess: true,
    })

    const url = toPublicMediaUrl(media.url)
    if (!url) {
      return NextResponse.json({ error: 'Upload did not produce a public URL' }, { status: 500 })
    }

    return NextResponse.json({ id: media.id, url })
  } catch (error) {
    console.error('Media upload failed:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
