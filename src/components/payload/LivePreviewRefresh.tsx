'use client'

import { RefreshRouteOnSave } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'

/** Refreshes the embedded Next.js page after Payload saves a draft or publish. */
export function LivePreviewRefresh() {
  const router = useRouter()
  const serverURL =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '')

  if (!serverURL) return null

  return (
    <RefreshRouteOnSave
      refresh={() => router.refresh()}
      serverURL={serverURL}
    />
  )
}
