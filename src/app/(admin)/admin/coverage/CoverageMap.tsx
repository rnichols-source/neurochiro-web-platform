'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'
import { GeoJSONSource, Map, Marker, NavigationControl, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { billingLabel } from '@/lib/admin/coverage-types'
import type { DemandPoint, GapSummary, MapDoctor, MentionPoint } from '@/lib/admin/coverage-types'
import type { PopupFields } from '@/lib/admin/popup-dom'
import { buildDoctorPopup } from './DoctorPopup'

const STYLE_URL = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
const FONT = ['Open Sans Bold', 'Open Sans Regular']

type DoctorProps = {
  name: string
  practice: string
  city: string
  badge: string
  billing: string
  paying: number
  other: number
  doctors: string
}

type DoctorCluster = { paying: number; other: number }
type DemandProps = { label: string; zip: string; confirmed: number; pending: number; sum: number }
type DemandCluster = { sum: number }

export type CoverageFrame =
  | { mode: 'fly'; lng: number; lat: number; zoom: number }
  | { mode: 'ease'; lng: number; lat: number; zoom: number }
  | { mode: 'bounds'; west: number; south: number; east: number; north: number }

export type CoveragePin = { lng: number; lat: number; label: string }

export type CoverageMapProps = {
  doctors: MapDoctor[]
  demand: DemandPoint[]
  mentions: MentionPoint[]
  gaps: GapSummary[]
  showDoctors: boolean
  showDemand: boolean
  showMentions: boolean
  showGaps: boolean
  viewKey: string
  center: [number, number]
  zoom: number
  flyTo: { lng: number; lat: number; token: number } | null
  frame: CoverageFrame | null
  pin: CoveragePin | null
}

function applyFrame(map: Map, frame: CoverageFrame | null) {
  if (!frame) return
  if (frame.mode === 'bounds') {
    const west = Math.min(frame.west, frame.east)
    const east = Math.max(frame.west, frame.east)
    const south = Math.min(frame.south, frame.north)
    const north = Math.max(frame.south, frame.north)
    if (![west, south, east, north].every((value) => Number.isFinite(value))) return
    map.fitBounds([[west, south], [east, north]], { padding: 40, duration: 700, maxZoom: 12 })
    return
  }
  const camera = { center: [frame.lng, frame.lat] as [number, number], zoom: frame.zoom, duration: 700 }
  if (frame.mode === 'fly') map.flyTo(camera)
  else map.easeTo(camera)
}

function placeMarker(map: Map, pin: CoveragePin | null, current: Marker | null): Marker | null {
  if (current) current.remove()
  if (!pin) return null
  const root = document.createElement('div')
  root.style.display = 'flex'
  root.style.flexDirection = 'column'
  root.style.alignItems = 'center'
  root.style.pointerEvents = 'none'
  const label = document.createElement('div')
  label.textContent = pin.label
  label.style.background = '#1E2D3B'
  label.style.color = '#F5F3EF'
  label.style.font = '700 12px system-ui, sans-serif'
  label.style.padding = '4px 8px'
  label.style.borderRadius = '999px'
  label.style.marginBottom = '4px'
  label.style.maxWidth = '220px'
  label.style.overflow = 'hidden'
  label.style.textOverflow = 'ellipsis'
  const dot = document.createElement('div')
  dot.style.width = '14px'
  dot.style.height = '14px'
  dot.style.borderRadius = '999px'
  dot.style.background = '#D66829'
  dot.style.border = '2px solid #ffffff'
  root.append(label, dot)
  return new Marker({ element: root, anchor: 'bottom' }).setLngLat([pin.lng, pin.lat]).addTo(map)
}

function collection(features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features }
}

function textLines(lines: string[]): HTMLElement {
  const root = document.createElement('div')
  root.style.padding = '12px'
  root.style.maxWidth = '260px'
  root.style.fontFamily = 'system-ui, sans-serif'
  root.style.color = '#1E2D3B'
  lines.forEach((line, index) => {
    const row = document.createElement('div')
    row.textContent = line
    row.style.fontSize = index === 0 ? '14px' : '12px'
    row.style.fontWeight = index === 0 ? '700' : '400'
    row.style.marginTop = index === 0 ? '0' : '4px'
    root.appendChild(row)
  })
  return root
}

function source(map: Map, id: string): GeoJSONSource | null {
  const found = map.getSource(id)
  return found instanceof GeoJSONSource ? found : null
}

function show(map: Map, id: string, visible: boolean) {
  if (!map.getLayer(id)) return
  map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none')
}

function pointCoords(feature: GeoJSON.Feature | undefined): [number, number] | null {
  if (!feature || feature.geometry.type !== 'Point') return null
  const [lng, lat] = feature.geometry.coordinates
  if (typeof lng !== 'number' || typeof lat !== 'number') return null
  return [lng, lat]
}

function prop(feature: GeoJSON.Feature, key: string): string {
  const value = feature.properties?.[key]
  return value == null ? '' : String(value)
}

function stackDoctors(doctors: MapDoctor[]): GeoJSON.Feature<GeoJSON.Point, DoctorProps>[] {
  const groups = new globalThis.Map<string, MapDoctor[]>()
  for (const doctor of doctors) {
    const key = `${doctor.lat.toFixed(5)},${doctor.lng.toFixed(5)}`
    const list = groups.get(key)
    if (list) list.push(doctor)
    else groups.set(key, [doctor])
  }
  return [...groups.values()].map((group) => {
    const doctor = group[0]
    const stack: PopupFields[] = group.map((item) => ({
      id: item.id,
      name: item.name,
      practice: item.practice,
      city: [item.city, item.state].filter(Boolean).join(', '),
      billing: billingLabel(item.billing),
    }))
    return {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [doctor.lng, doctor.lat] },
      properties: {
        name: doctor.name,
        practice: doctor.practice,
        city: [doctor.city, doctor.state].filter(Boolean).join(', '),
        badge: billingLabel(doctor.billing),
        billing: doctor.billing,
        paying: group.some((item) => item.billing === 'paying') ? 1 : 0,
        other: group.every((item) => item.billing === 'paying') ? 0 : 1,
        doctors: JSON.stringify(stack),
      },
    }
  })
}

function readStack(feature: GeoJSON.Feature): PopupFields[] {
  try {
    const parsed = JSON.parse(prop(feature, 'doctors')) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => {
      if (!item || typeof item !== 'object') return []
      const row = item as Record<string, unknown>
      const id = typeof row.id === 'string' ? row.id : ''
      if (!id) return []
      return [{
        id,
        name: typeof row.name === 'string' ? row.name : '',
        practice: typeof row.practice === 'string' ? row.practice : '',
        city: typeof row.city === 'string' ? row.city : '',
        billing: typeof row.billing === 'string' ? row.billing : '',
      }]
    })
  } catch {
    return []
  }
}

export default function CoverageMap({
  doctors,
  demand,
  mentions,
  gaps,
  showDoctors,
  showDemand,
  showMentions,
  showGaps,
  viewKey,
  center,
  zoom,
  flyTo,
  frame,
  pin,
}: CoverageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const readyRef = useRef(false)
  const doctorIndexRef = useRef<Supercluster<DoctorProps, DoctorCluster> | null>(null)
  const demandIndexRef = useRef<Supercluster<DemandProps, DemandCluster> | null>(null)
  const drawRef = useRef<(map: Map) => void>(() => {})
  const centerRef = useRef(center)
  const zoomRef = useRef(zoom)
  const frameRef = useRef<CoverageFrame | null>(null)
  const pinValueRef = useRef<CoveragePin | null>(null)
  const pinRef = useRef<Marker | null>(null)

  const doctorIndex = useMemo(() => {
    const index = new Supercluster<DoctorProps, DoctorCluster>({
      radius: 48,
      maxZoom: 14,
      map: (item) => ({ paying: item.paying, other: item.other }),
      reduce: (accumulated, item) => {
        accumulated.paying += item.paying
        accumulated.other += item.other
      },
    })
    index.load(stackDoctors(doctors))
    return index
  }, [doctors])

  const demandIndex = useMemo(() => {
    const index = new Supercluster<DemandProps, DemandCluster>({
      radius: 56,
      maxZoom: 12,
      map: (item) => ({ sum: item.sum }),
      reduce: (accumulated, item) => {
        accumulated.sum += item.sum
      },
    })
    index.load(demand.map((point) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [point.lng, point.lat] },
      properties: {
        label: [point.city, point.state].filter(Boolean).join(', ') || point.zip,
        zip: point.zip,
        confirmed: point.confirmed,
        pending: point.pending,
        sum: point.count,
      },
    })))
    return index
  }, [demand])

  useEffect(() => {
    doctorIndexRef.current = doctorIndex
    demandIndexRef.current = demandIndex
  }, [doctorIndex, demandIndex])

  const draw = useCallback((map: Map) => {
    const doctorClusters = doctorIndexRef.current
    const demandClusters = demandIndexRef.current
    if (!doctorClusters || !demandClusters) return
    const bounds = map.getBounds()
    const clusterZoom = Math.round(map.getZoom())
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    source(map, 'doctors')?.setData(collection(doctorClusters.getClusters(bbox, clusterZoom)))
    source(map, 'demand')?.setData(collection(demandClusters.getClusters(bbox, clusterZoom)))
    source(map, 'mentions')?.setData(collection(mentions.map((mention) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [mention.lng, mention.lat] },
      properties: {
        label: [mention.city, mention.state].filter(Boolean).join(', ') || mention.city,
        count: mention.count,
      },
    }))))
    source(map, 'gaps')?.setData(collection(gaps.map((gap) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [gap.lng, gap.lat] },
      properties: {
        label: gap.label,
        demand: gap.demandCount,
        miles: gap.nearestMiles == null ? '' : String(Math.round(gap.nearestMiles)),
      },
    }))))
    show(map, 'doctor-clusters', showDoctors)
    show(map, 'doctor-cluster-count', showDoctors)
    show(map, 'doctor-points', showDoctors)
    show(map, 'demand-clusters', showDemand)
    show(map, 'demand-cluster-count', showDemand)
    show(map, 'demand-points', showDemand)
    show(map, 'mention-points', showMentions)
    show(map, 'gap-rings', showGaps)
  }, [mentions, gaps, showDoctors, showDemand, showMentions, showGaps])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

  useEffect(() => {
    frameRef.current = frame
    pinValueRef.current = pin
  }, [frame, pin])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const map = new Map({
      container,
      style: STYLE_URL,
      center: centerRef.current,
      zoom: zoomRef.current,
    })
    map.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    mapRef.current = map

    map.on('load', () => {
      readyRef.current = true
      map.addSource('doctors', { type: 'geojson', data: collection([]) })
      map.addSource('demand', { type: 'geojson', data: collection([]) })
      map.addSource('mentions', { type: 'geojson', data: collection([]) })
      map.addSource('gaps', { type: 'geojson', data: collection([]) })

      map.addLayer({
        id: 'gap-rings',
        type: 'circle',
        source: 'gaps',
        paint: {
          'circle-color': 'rgba(225, 29, 72, 0.12)',
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 12, 6, 22, 10, 36],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#E11D48',
        },
      })
      map.addLayer({
        id: 'doctor-clusters',
        type: 'circle',
        source: 'doctors',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'other'], 0],
            '#D66829',
            ['==', ['get', 'paying'], 0],
            '#1E2D3B',
            '#8C4A2F',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 16, 8, 20, 24, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.addLayer({
        id: 'doctor-cluster-count',
        type: 'symbol',
        source: 'doctors',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': [
            'case',
            ['all', ['>', ['get', 'paying'], 0], ['>', ['get', 'other'], 0]],
            ['concat', ['to-string', ['get', 'paying']], '+', ['to-string', ['get', 'other']]],
            ['get', 'point_count_abbreviated'],
          ],
          'text-size': 12,
          'text-font': FONT,
        },
        paint: { 'text-color': '#ffffff' },
      })
      map.addLayer({
        id: 'doctor-points',
        type: 'circle',
        source: 'doctors',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': [
            'match', ['get', 'billing'],
            'paying', '#D66829',
            'trialing', '#F5F3EF',
            'past_due', '#D97706',
            'founding-comped', '#1E2D3B',
            'free', '#ffffff',
            'pending', '#9CA3AF',
            'mismatch', '#ffffff',
            '#9CA3AF',
          ],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 8, 7, 14, 10],
          'circle-stroke-width': [
            'match', ['get', 'billing'],
            'trialing', 3,
            'past_due', 3,
            'free', 2,
            'mismatch', 3,
            2,
          ],
          'circle-stroke-color': [
            'match', ['get', 'billing'],
            'paying', '#D66829',
            'trialing', '#D66829',
            'past_due', '#1E2D3B',
            'founding-comped', '#ffffff',
            'free', '#1E2D3B',
            'pending', '#6B7280',
            'mismatch', '#E11D48',
            '#1E2D3B',
          ],
        },
      })
      map.addLayer({
        id: 'demand-clusters',
        type: 'circle',
        source: 'demand',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': '#5C4D9A',
          'circle-radius': ['step', ['get', 'point_count'], 16, 8, 20, 24, 26],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.addLayer({
        id: 'demand-cluster-count',
        type: 'symbol',
        source: 'demand',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['to-string', ['get', 'sum']],
          'text-size': 12,
          'text-font': FONT,
        },
        paint: { 'text-color': '#ffffff' },
      })
      map.addLayer({
        id: 'demand-points',
        type: 'circle',
        source: 'demand',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#5C4D9A',
          'circle-radius': ['interpolate', ['linear'], ['get', 'sum'], 1, 7, 8, 12, 30, 18],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })
      map.addLayer({
        id: 'mention-points',
        type: 'circle',
        source: 'mentions',
        paint: {
          'circle-color': '#0E7490',
          'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'count']], 1, 6, 4, 12, 10, 20],
          'circle-opacity': 0.85,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      })

      const open = (coords: [number, number], node: HTMLElement) => {
        new Popup({ offset: 12, maxWidth: '280px', closeButton: true, focusAfterOpen: false })
          .setLngLat(coords)
          .setDOMContent(node)
          .addTo(map)
      }

      map.on('click', 'doctor-clusters', (event) => {
        const feature = event.features?.[0]
        const coords = pointCoords(feature)
        const clusterId = Number(feature?.properties?.cluster_id)
        const index = doctorIndexRef.current
        if (!feature || !coords || !index || !Number.isFinite(clusterId)) return
        try {
          map.easeTo({ center: coords, zoom: index.getClusterExpansionZoom(clusterId) })
        } catch {
          map.easeTo({ center: coords, zoom: map.getZoom() + 2 })
        }
      })
      map.on('click', 'demand-clusters', (event) => {
        const feature = event.features?.[0]
        const coords = pointCoords(feature)
        const clusterId = Number(feature?.properties?.cluster_id)
        const index = demandIndexRef.current
        if (!feature || !coords || !index || !Number.isFinite(clusterId)) return
        try {
          map.easeTo({ center: coords, zoom: index.getClusterExpansionZoom(clusterId) })
        } catch {
          map.easeTo({ center: coords, zoom: map.getZoom() + 2 })
        }
      })
      map.on('click', 'doctor-points', (event) => {
        const feature = event.features?.[0]
        const coords = pointCoords(feature)
        if (!feature || !coords) return
        const stack = readStack(feature)
        open(coords, buildDoctorPopup(stack.length > 0 ? stack : [{
          id: prop(feature, 'id'),
          name: prop(feature, 'name'),
          practice: prop(feature, 'practice'),
          city: prop(feature, 'city'),
          billing: prop(feature, 'badge'),
        }]))
      })
      map.on('click', 'demand-points', (event) => {
        const feature = event.features?.[0]
        const coords = pointCoords(feature)
        if (!feature || !coords) return
        const confirmed = prop(feature, 'confirmed')
        const pending = prop(feature, 'pending')
        open(coords, textLines([
          prop(feature, 'label'),
          `ZIP ${prop(feature, 'zip')}`,
          `${confirmed} confirmed · ${pending} pending`,
        ]))
      })
      map.on('click', 'mention-points', (event) => {
        const feature = event.features?.[0]
        const coords = pointCoords(feature)
        if (!feature || !coords) return
        const count = Number(prop(feature, 'count')) || 0
        open(coords, textLines([
          prop(feature, 'label'),
          `${count} mention${count === 1 ? '' : 's'}`,
        ]))
      })
      map.on('click', 'gap-rings', (event) => {
        const feature = event.features?.[0]
        const coords = pointCoords(feature)
        if (!feature || !coords) return
        const miles = prop(feature, 'miles')
        open(coords, textLines([
          prop(feature, 'label'),
          `${prop(feature, 'demand')} waiting`,
          miles ? `Nearest doctor ${miles} mi` : 'No doctor on the map',
        ]))
      })

      for (const id of ['doctor-clusters', 'doctor-points', 'demand-clusters', 'demand-points', 'mention-points', 'gap-rings']) {
        map.on('mouseenter', id, () => { map.getCanvas().style.cursor = 'pointer' })
        map.on('mouseleave', id, () => { map.getCanvas().style.cursor = '' })
      }
      drawRef.current(map)
      pinRef.current = placeMarker(map, pinValueRef.current, null)
      applyFrame(map, frameRef.current)
    })

    map.on('moveend', () => {
      if (readyRef.current) drawRef.current(map)
    })

    return () => {
      readyRef.current = false
      pinRef.current?.remove()
      pinRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    drawRef.current(map)
  }, [doctors, demand, mentions, gaps, showDoctors, showDemand, showMentions, showGaps])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current) return
    pinRef.current = placeMarker(map, pin, pinRef.current)
    applyFrame(map, frame)
  }, [frame, pin])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current || frame) return
    map.easeTo({ center, zoom, duration: 700 })
  }, [viewKey, center, zoom, frame])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current || !flyTo || frame) return
    map.easeTo({ center: [flyTo.lng, flyTo.lat], zoom: Math.max(map.getZoom(), 8), duration: 700 })
  }, [flyTo, frame])

  return <div ref={containerRef} className="h-full w-full touch-none" role="region" aria-label="Coverage map" />
}
