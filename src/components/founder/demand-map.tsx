'use client'

import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

export type MapPoint = { lat: number; lng: number; n: number }
export type MapDoctor = { lat: number; lng: number; name: string; where: string }
export type MapGap = { lat: number; lng: number; label: string; miles: number }

export function DemandMap({
  points,
  doctors,
  gaps,
  focus,
  world,
}: {
  points: MapPoint[]
  doctors: MapDoctor[]
  gaps: MapGap[]
  focus: { lat: number; lng: number; label: string } | null
  world: boolean
}) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const map = new maplibregl.Map({
      container: node,
      style: STYLE_URL,
      center: focus ? [focus.lng, focus.lat] : world ? [10, 20] : [-97, 39],
      zoom: focus ? 7 : world ? 1.2 : 3.1,
      attributionControl: { compact: true },
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')
    map.on('load', () => {
      map.addSource('demand', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: points.map((point) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [point.lng, point.lat] },
            properties: { n: point.n },
          })),
        },
      })
      map.addLayer({
        id: 'demand-circles',
        type: 'circle',
        source: 'demand',
        paint: {
          'circle-color': '#2C6BB4',
          'circle-opacity': 0.35,
          'circle-stroke-color': '#2C6BB4',
          'circle-stroke-width': 1,
          'circle-radius': ['interpolate', ['linear'], ['get', 'n'], 1, 4, 20, 10, 80, 18],
        },
      })
      map.addSource('doctors', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: doctors.map((doctor) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [doctor.lng, doctor.lat] },
            properties: { name: doctor.name, where: doctor.where },
          })),
        },
      })
      map.addLayer({
        id: 'doctor-dots',
        type: 'circle',
        source: 'doctors',
        paint: {
          'circle-color': '#D66829',
          'circle-radius': 5,
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 1.5,
        },
      })
      map.on('click', 'doctor-dots', (event) => {
        const feature = event.features?.[0]
        const props = feature?.properties
        if (!props || feature.geometry.type !== 'Point') return
        new maplibregl.Popup({ offset: 12 })
          .setLngLat(feature.geometry.coordinates as [number, number])
          .setHTML(`<strong>${escapeHtml(String(props.name))}</strong><br>${escapeHtml(String(props.where))}`)
          .addTo(map)
      })
      for (const gap of gaps.slice(0, 8)) {
        const marker = document.createElement('div')
        marker.style.cssText = 'width:18px;height:18px;border:2px dashed #C2413B;border-radius:99px;background:transparent'
        marker.title = `${gap.label} · ${gap.miles} mi`
        new maplibregl.Marker({ element: marker }).setLngLat([gap.lng, gap.lat]).addTo(map)
      }
      if (focus) {
        new maplibregl.Marker({ color: '#1F4F8C' }).setLngLat([focus.lng, focus.lat]).addTo(map)
        map.flyTo({ center: [focus.lng, focus.lat], zoom: 7 })
      }
    })
    return () => map.remove()
  }, [points, doctors, gaps, focus, world])

  return <div ref={ref} className="h-[420px] w-full overflow-hidden rounded-2xl bg-[#F7F9FC] md:h-[520px]" />
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char))
}
