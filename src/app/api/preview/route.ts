import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { getPayload, type PayloadRequest } from 'payload'
import config from '@payload-config'

/** Enables a short-lived Next.js draft session for authenticated CMS editors. */
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  if (
    !process.env.PREVIEW_SECRET ||
    previewSecret !== process.env.PREVIEW_SECRET
  ) {
    return new Response('No autorizado para ver esta vista previa.', {
      status: 403,
    })
  }

  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return new Response('La ruta de vista previa no es válida.', {
      status: 400,
    })
  }

  const payload = await getPayload({ config })
  const { user } = await payload.auth({
    req: request as unknown as PayloadRequest,
    headers: request.headers,
  })

  if (!user || !['admin', 'editor'].includes(user.role as string)) {
    return new Response('No autorizado para ver esta vista previa.', {
      status: 403,
    })
  }

  const draft = await draftMode()
  draft.enable()
  redirect(path)
}
