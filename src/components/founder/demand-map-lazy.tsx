'use client'

import dynamic from 'next/dynamic'
import type { MapDoctor, MapGap, MapPoint } from '@/components/founder/demand-map'

const DemandMap = dynamic(() => import('@/components/founder/demand-map').then((mod) => mod.DemandMap), {
  ssr: false,
  loading: () => <div className="h-[420px] w-full overflow-hidden rounded-2xl bg-[#F7F9FC] md:h-[520px]" aria-hidden="true" />,
})

export function DemandMapLazy(props: {
  points: MapPoint[]
  doctors: MapDoctor[]
  gaps: MapGap[]
  focus: { lat: number; lng: number; label: string } | null
  world: boolean
}) {
  return <DemandMap {...props} />
}
