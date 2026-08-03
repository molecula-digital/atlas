'use client'

import dynamic from 'next/dynamic'

const SinaloaMap = dynamic(() => import('@/components/maps/SinaloaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-elevated animate-pulse rounded-lg" />
  ),
})

export default SinaloaMap
