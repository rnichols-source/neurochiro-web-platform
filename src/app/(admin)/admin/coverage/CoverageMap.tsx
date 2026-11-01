'use client'

import { useCallback, useEffect, useRef } from 'react'
import { GeoJSONSource, Map, NavigationControl, Popup } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import Supercluster from 'supercluster'
import { billingLabel } from '@/lib/admin/coverage-types'
import type { DemandPoint, GapSummary, MapDoctor, MentionPoint } from '@/lib/admin/coverage-types'
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
}

type DoctorCluster = { paying: number; other: number }
type DemandProps = { label: string; zip: string; confirmed: number; pending: number; sum: number }
type DemandCluster = { sum: number }

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
}: CoverageMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const readyRef = useRef(false)
  const doctorIndexRef = useRef<Supercluster<DoctorProps, DoctorCluster> | null>(null)
  const demandIndexRef = useRef<Supercluster<DemandProps, DemandCluster> | null>(null)
  const drawRef = useRef<(map: Map) => void>(() => {})
  const centerRef = useRef(center)
  const zoomRef = useRef(zoom)

  const draw = useCallback((map: Map) => {
    const doctorIndex = new Supercluster<DoctorProps, DoctorCluster>({
      radius: 48,
      maxZoom: 14,
      map: (item) => ({ paying: item.paying, other: item.other }),
      reduce: (accumulated, item) => {
        accumulated.paying += item.paying
        accumulated.other += item.other
      },
    })
    doctorIndex.load(doctors.map((doctor) => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [doctor.lng, doctor.lat] },
      properties: {
        name: doctor.name,
        practice: doctor.practice,
        city: [doctor.city, doctor.state].filter(Boolean).join(', '),
        badge: billingLabel(doctor.billing),
        billing: doctor.billing,
        paying: doctor.billing === 'paying' ? 1 : 0,
        other: doctor.billing === 'paying' ? 0 : 1,
      },
    })))
    doctorIndexRef.current = doctorIndex

    const demandIndex = new Supercluster<DemandProps, DemandCluster>({
      radius: 56,
      maxZoom: 12,
      map: (item) => ({ sum: item.sum }),
      reduce: (accumulated, item) => {
        accumulated.sum += item.sum
      },
    })
    demandIndex.load(demand.map((point) => ({
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
    demandIndexRef.current = demandIndex

    const bounds = map.getBounds()
    const clusterZoom = Math.round(map.getZoom())
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ]
    source(map, 'doctors')?.setData(collection(doctorIndex.getClusters(bbox, clusterZoom)))
    source(map, 'demand')?.setData(collection(demandIndex.getClusters(bbox, clusterZoom)))
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
  }, [doctors, demand, mentions, gaps, showDoctors, showDemand, showMentions, showGaps])

  useEffect(() => {
    drawRef.current = draw
  }, [draw])

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
          'circle-color': ['case', ['==', ['get', 'billing'], 'paying'], '#D66829', '#1E2D3B'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 8, 7, 14, 10],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
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
        open(coords, buildDoctorPopup({
          name: prop(feature, 'name'),
          practice: prop(feature, 'practice'),
          city: prop(feature, 'city'),
          billing: prop(feature, 'badge'),
        }))
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
    })

    map.on('moveend', () => {
      if (readyRef.current) drawRef.current(map)
    })

    return () => {
      readyRef.current = false
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
    map.easeTo({ center, zoom, duration: 700 })
  }, [viewKey, center, zoom])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !readyRef.current || !flyTo) return
    map.easeTo({ center: [flyTo.lng, flyTo.lat], zoom: Math.max(map.getZoom(), 8), duration: 700 })
  }, [flyTo])

  return <div ref={containerRef} className="h-full w-full touch-none" role="region" aria-label="Coverage map" />
}
