'use client'

import { useEffect, useRef } from 'react'
import { Map, Marker } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

export default function MemberMiniMap({ lat, lng, label }: { lat: number; lng: number; label: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = ref.current
    if (!container) return
    const map = new Map({
      container,
      style: STYLE_URL,
      center: [lng, lat],
      zoom: 12,
      interactive: false,
      attributionControl: false,
    })
    const marker = new Marker({ color: '#D66829' }).setLngLat([lng, lat]).addTo(map)
    return () => {
      marker.remove()
      map.remove()
    }
  }, [lat, lng])

  return <div ref={ref} className="h-40 w-full rounded-xl" role="img" aria-label={label} />
}
