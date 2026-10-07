"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Search, AlertTriangle, ExternalLink, Globe, ChevronDown, ChevronUp, Eye, EyeOff, Copy, Check, Send, MessageSquare, Map as MapIcon } from "lucide-react"
import Link from "next/link"
import { CoverageDoctor, DemandZip, CoverageStats, MentionCity, MarketCluster, LookupResult, ReplyTemplate, lookupNearby, addMarketLead, logReply, getSentDoctorIds, getFarDistanceThreshold, autoLogDemand, undoAutoLogDemand } from "./actions"

// ── Colors ──
const COLORS = {
  verified: '#22c55e',
  pending: '#f59e0b',
  confirmedSub: '#8b5cf6',
  pendingSub: '#8b5cf6',
  gap: '#f43f5e',
  mentions: '#06b6d4',
}

type LayerKey = 'verified' | 'pending' | 'confirmedSub' | 'pendingSub' | 'gaps' | 'mentions'

const LAYER_CONFIG: { key: LayerKey; label: string; color: string; opacity?: number }[] = [
  { key: 'verified', label: 'Verified Doctors', color: COLORS.verified },
  { key: 'pending', label: 'Pending Doctors', color: COLORS.pending },
  { key: 'confirmedSub', label: 'Confirmed Subscribers', color: COLORS.confirmedSub },
  { key: 'pendingSub', label: 'Pending Subscribers', color: COLORS.pendingSub, opacity: 0.4 },
  { key: 'mentions', label: 'Comment Mentions', color: COLORS.mentions },
  { key: 'gaps', label: 'Gaps (no doc <50mi)', color: COLORS.gap },
]

const STORAGE_KEY = 'nc_coverage_layers_v2'
const MAP_COLLAPSED_KEY = 'nc_coverage_map_collapsed'

function loadSavedLayers(): Record<LayerKey, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { verified: true, pending: true, confirmedSub: true, pendingSub: true, gaps: true, mentions: true }
}

function loadMapCollapsed(): boolean {
  try {
    const saved = localStorage.getItem(MAP_COLLAPSED_KEY)
    if (saved !== null) return saved === 'true'
  } catch {}
  return true // default collapsed
}

// ── Main Component ──

export default function CoverageMapClient({
  doctors, demand, stats, mentions, templates,
}: {
  doctors: CoverageDoctor[]
  demand: DemandZip[]
  stats: CoverageStats
  mentions: MentionCity[]
  templates: ReplyTemplate[]
}) {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(loadSavedLayers)
  const [showStatsPanel, setShowStatsPanel] = useState(true)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupCountry, setLookupCountry] = useState(() => {
    if (typeof window === 'undefined') return 'US'
    return localStorage.getItem('nc_lookup_country') || 'US'
  })
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null)
  const [lookupLabel, setLookupLabel] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSort, setLookupSort] = useState<'distance' | 'name' | 'tier'>('distance')
  const [sentDoctorIds, setSentDoctorIds] = useState<Set<string>>(new Set())
  const [farThreshold, setFarThreshold] = useState(30)
  const [mapCollapsed, setMapCollapsed] = useState(loadMapCollapsed)
  const [sessionCount, setSessionCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [couldNotResolve, setCouldNotResolve] = useState(false)
  const [resolvedCity, setResolvedCity] = useState('')
  const [resolvedState, setResolvedState] = useState('')
  const [confidence, setConfidence] = useState<'exact' | 'dominant' | 'ambiguous' | 'approximate' | undefined>(undefined)
  const [rejectedCandidates, setRejectedCandidates] = useState<{ city: string; state: string }[] | null>(null)
  const [showOtherResults, setShowOtherResults] = useState(false)
  const [autoLogResult, setAutoLogResult] = useState<{ id: string; reason: string } | null>(null)
  const lookupInputRef = useRef<HTMLInputElement>(null)
  const replyBtnRef = useRef<HTMLButtonElement>(null)
  const dmBtnRef = useRef<HTMLButtonElement>(null)
  const sentBtnRef = useRef<HTMLButtonElement>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const mapReadyRef = useRef(false)
  const mapInitializedRef = useRef(false)

  // Load sent doctor IDs + far threshold on mount
  useEffect(() => {
    getSentDoctorIds().then(ids => {
      setSentDoctorIds(new Set(ids))
      setTodayCount(ids.length)
    }).catch(() => {})
    getFarDistanceThreshold().then(setFarThreshold).catch(() => {})
  }, [])

  // Persist layer selections
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layers)) } catch {}
  }, [layers])

  // Persist map collapsed state
  useEffect(() => {
    try { localStorage.setItem(MAP_COLLAPSED_KEY, String(mapCollapsed)) } catch {}
  }, [mapCollapsed])

  const toggleLayer = (key: LayerKey) => setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  const showAll = () => setLayers({ verified: true, pending: true, confirmedSub: true, pendingSub: true, gaps: true, mentions: true })
  const hideAll = () => setLayers({ verified: false, pending: false, confirmedSub: false, pendingSub: false, gaps: false, mentions: false })

  // Country centres and zoom levels for map recentring
  const COUNTRY_VIEWS: Record<string, { center: [number, number]; zoom: number; label: string }> = {
    US: { center: [-96, 38], zoom: 3.8, label: 'States' },
    CA: { center: [-96, 56], zoom: 3.2, label: 'Provinces' },
    GB: { center: [-2, 54], zoom: 5.2, label: 'Regions' },
    NZ: { center: [174, -41], zoom: 5, label: 'Regions' },
    AU: { center: [134, -25], zoom: 3.5, label: 'States' },
  }

  // Filter doctors by selected country
  const countryDoctors = doctors.filter(d => {
    const dc = d.country || 'US'
    return lookupCountry === 'US' ? (dc === 'US') : dc === lookupCountry
  })

  // ── Build doctor features filtered by current toggles + country ──
  const buildDoctorFeatures = useCallback((showVerified: boolean, showPending: boolean) => {
    return countryDoctors
      .filter(d => {
        if (d.pin_status === 'invisible' || !d.latitude || !d.longitude || d.latitude === 0) return false
        if (d.pin_status === 'verified' && !showVerified) return false
        if (d.pin_status === 'pending' && !showPending) return false
        return true
      })
      .map(d => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [d.longitude!, d.latitude!] },
        properties: {
          id: d.id,
          name: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
          clinic: d.clinic_name || '', city: d.city || '', state: d.state || '',
          slug: d.slug || '', status: d.pin_status,
          created: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
          color: d.pin_status === 'verified' ? COLORS.verified : COLORS.pending,
        },
      }))
  }, [countryDoctors])

  // ── Map init (only when map section is visible) ──
  useEffect(() => {
    if (mapCollapsed || !mapRef.current || mapInstanceRef.current) return
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
    script.onload = () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css'
      document.head.appendChild(link)

      const maplibregl = (window as any).maplibregl
      const map = new maplibregl.Map({
        container: mapRef.current!, style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [-96, 38], zoom: 3.8, attributionControl: false,
      })
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('load', () => {
        mapInstanceRef.current = map
        mapReadyRef.current = true
        mapInitializedRef.current = true

        // Doctor source (clustered)
        map.addSource('doctors', {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: buildDoctorFeatures(layers.verified, layers.pending) },
          cluster: true, clusterMaxZoom: 14, clusterRadius: 25,
        })
        map.addLayer({ id: 'doctor-clusters', type: 'circle', source: 'doctors', filter: ['has', 'point_count'],
          paint: { 'circle-color': '#D66829', 'circle-radius': ['step', ['get', 'point_count'], 14, 5, 18, 15, 24], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        })
        map.addLayer({ id: 'doctor-cluster-count', type: 'symbol', source: 'doctors', filter: ['has', 'point_count'],
          layout: { 'text-field': '{point_count_abbreviated}', 'text-size': 13, 'text-font': ['Open Sans Bold'] }, paint: { 'text-color': '#fff' },
        })
        map.addLayer({ id: 'doctor-dots', type: 'circle', source: 'doctors', filter: ['!', ['has', 'point_count']],
          paint: { 'circle-color': ['get', 'color'], 'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 8, 7, 14, 10], 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
        })

        // Demand source (not clustered)
        const demandFeatures = demand.map(d => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [d.lng, d.lat] },
          properties: { zip: d.zip, city: d.city, state: d.state, confirmed: d.confirmed, pending: d.pending, total: d.confirmed + d.pending, gap: d.gap ? 1 : 0,
            demandType: d.gap ? 'gap' : d.confirmed > 0 ? 'confirmed' : 'pending' },
        }))
        map.addSource('demand', { type: 'geojson', data: { type: 'FeatureCollection', features: demandFeatures } })

        // Confirmed subscriber dots
        map.addLayer({ id: 'demand-confirmed', type: 'circle', source: 'demand',
          filter: ['==', ['get', 'demandType'], 'confirmed'],
          paint: { 'circle-color': COLORS.confirmedSub, 'circle-radius': ['interpolate', ['linear'], ['get', 'total'], 1, 8, 5, 12, 20, 18], 'circle-opacity': 0.7, 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' },
          layout: { visibility: layers.confirmedSub ? 'visible' : 'none' },
        })
        // Pending subscriber dots
        map.addLayer({ id: 'demand-pending', type: 'circle', source: 'demand',
          filter: ['==', ['get', 'demandType'], 'pending'],
          paint: { 'circle-color': COLORS.pendingSub, 'circle-radius': ['interpolate', ['linear'], ['get', 'total'], 1, 7, 5, 10, 20, 16], 'circle-opacity': 0.35, 'circle-stroke-width': 2, 'circle-stroke-color': COLORS.pendingSub, 'circle-stroke-opacity': 0.5 },
          layout: { visibility: layers.pendingSub ? 'visible' : 'none' },
        })
        // Gap dots
        map.addLayer({ id: 'demand-gaps', type: 'circle', source: 'demand',
          filter: ['==', ['get', 'demandType'], 'gap'],
          paint: { 'circle-color': COLORS.gap, 'circle-radius': ['interpolate', ['linear'], ['get', 'total'], 1, 10, 5, 14, 20, 22], 'circle-opacity': 0.85, 'circle-stroke-width': 3, 'circle-stroke-color': '#fff' },
          layout: { visibility: layers.gaps ? 'visible' : 'none' },
        })

        // Mentions source — filter by selected country
        const countryMentions = mentions.filter(m => (m.country || 'US') === lookupCountry)
        const mentionFeatures = countryMentions.map(m => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
          properties: { city: m.city, state: m.state, count: m.count, gap: m.gap ? 1 : 0 },
        }))
        map.addSource('mentions', { type: 'geojson', data: { type: 'FeatureCollection', features: mentionFeatures } })
        map.addLayer({ id: 'mentions-dots', type: 'circle', source: 'mentions',
          paint: {
            'circle-color': COLORS.mentions,
            'circle-radius': ['interpolate', ['linear'], ['get', 'count'], 1, 7, 5, 12, 15, 18, 30, 24],
            'circle-opacity': 0.7,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#fff',
          },
          layout: { visibility: layers.mentions ? 'visible' : 'none' },
        })

        // Click handlers
        map.on('click', 'doctor-clusters', (e: any) => {
          const f = map.queryRenderedFeatures(e.point, { layers: ['doctor-clusters'] })
          if (!f.length) return
          map.getSource('doctors').getClusterExpansionZoom(f[0].properties.cluster_id, (_: any, z: number) => { if (!_) map.easeTo({ center: f[0].geometry.coordinates, zoom: z }) })
        })
        map.on('click', 'doctor-dots', (e: any) => {
          if (!e.features?.length) return
          const p = e.features[0].properties, coords = e.features[0].geometry.coordinates.slice()
          const badge = p.status === 'verified' ? '<span style="color:#22c55e;font-size:11px;font-weight:700;">Verified</span>' : '<span style="color:#f59e0b;font-size:11px;font-weight:700;">Pending</span>'
          new maplibregl.Popup({ offset: 12, maxWidth: '300px', closeButton: true, focusAfterOpen: false }).setLngLat(coords).setHTML(`
            <div style="padding:14px;font-family:-apple-system,system-ui,sans-serif;min-width:200px;">
              <div style="font-size:15px;font-weight:700;color:#1E2D3B;margin-bottom:2px;">${p.name}</div>
              <div style="font-size:12px;color:#666;margin-bottom:4px;">${p.clinic}</div>
              <div style="font-size:12px;color:#999;margin-bottom:6px;">${p.city}, ${p.state}</div>
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">${badge}<span style="color:#999;font-size:11px;">Since ${p.created}</span></div>
              <div style="display:flex;gap:6px;">
                <a href="/directory/${p.slug||p.id}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#D66829;color:white;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;">Profile</a>
                <a href="/admin/directory?search=${encodeURIComponent(p.name)}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#1E2D3B;color:white;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;">Admin</a>
              </div>
            </div>`).addTo(map)
        })
        const demandClick = (e: any) => {
          if (!e.features?.length) return
          const p = e.features[0].properties, coords = e.features[0].geometry.coordinates.slice()
          const gl = p.gap === 1 ? '<div style="color:#f43f5e;font-weight:700;font-size:11px;margin-top:6px;">No doctor within 50 miles</div>' : '<div style="color:#22c55e;font-size:11px;margin-top:6px;">Doctor nearby</div>'
          new maplibregl.Popup({ offset: 12, maxWidth: '240px', closeButton: true, focusAfterOpen: false }).setLngLat(coords).setHTML(`
            <div style="padding:12px;font-family:-apple-system,system-ui,sans-serif;">
              <div style="font-size:14px;font-weight:700;color:#1E2D3B;">${p.city}, ${p.state}</div>
              <div style="font-size:12px;color:#666;margin-bottom:6px;">ZIP ${p.zip}</div>
              ${p.confirmed>0?`<div style="font-size:13px;font-weight:700;color:#8b5cf6;">${p.confirmed} confirmed</div>`:''}
              ${p.pending>0?`<div style="font-size:12px;color:#a78bfa;">${p.pending} pending</div>`:''}
              ${gl}
            </div>`).addTo(map)
        }
        ;['demand-confirmed','demand-pending','demand-gaps'].forEach(l => { map.on('click', l, demandClick) })

        // Mentions click handler
        map.on('click', 'mentions-dots', (e: any) => {
          if (!e.features?.length) return
          const p = e.features[0].properties, coords = e.features[0].geometry.coordinates.slice()
          const gl = p.gap === 1 ? '<div style="color:#f43f5e;font-weight:700;font-size:11px;margin-top:6px;">No doctor within 50 miles</div>' : '<div style="color:#22c55e;font-size:11px;margin-top:6px;">Doctor nearby</div>'
          new maplibregl.Popup({ offset: 12, maxWidth: '240px', closeButton: true, focusAfterOpen: false }).setLngLat(coords).setHTML(`
            <div style="padding:12px;font-family:-apple-system,system-ui,sans-serif;">
              <div style="font-size:14px;font-weight:700;color:#1E2D3B;">${p.city}, ${p.state}</div>
              <div style="font-size:13px;font-weight:700;color:#06b6d4;margin-top:4px;">${p.count} comment mention${p.count > 1 ? 's' : ''}</div>
              <div style="font-size:11px;color:#999;margin-top:2px;">From Instagram comments</div>
              ${gl}
            </div>`).addTo(map)
        })

        // Cursors
        ;['doctor-dots','doctor-clusters','demand-confirmed','demand-pending','demand-gaps','mentions-dots'].forEach(l => {
          map.on('mouseenter', l, () => { map.getCanvas().style.cursor = 'pointer' })
          map.on('mouseleave', l, () => { map.getCanvas().style.cursor = '' })
        })
      })
    }
    document.head.appendChild(script)
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null; mapReadyRef.current = false }
  }, [mapCollapsed])

  // ── Sync layer visibility when toggles change ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReadyRef.current) return

    // Doctor layers: rebuild source data so clusters recount
    try {
      const src = map.getSource('doctors')
      if (src) src.setData({ type: 'FeatureCollection', features: buildDoctorFeatures(layers.verified, layers.pending) })
    } catch {}

    // Demand + mentions layers: toggle visibility
    const demandMap: [string, LayerKey][] = [
      ['demand-confirmed', 'confirmedSub'],
      ['demand-pending', 'pendingSub'],
      ['demand-gaps', 'gaps'],
      ['mentions-dots', 'mentions'],
    ]
    for (const [layerId, key] of demandMap) {
      try {
        if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', layers[key] ? 'visible' : 'none')
      } catch {}
    }
  }, [layers, buildDoctorFeatures])

  // ── Recentre map when country changes ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !mapReadyRef.current) return

    const view = COUNTRY_VIEWS[lookupCountry] || COUNTRY_VIEWS.US
    map.easeTo({ center: view.center, zoom: view.zoom, duration: 800 })

    // Rebuild doctor pins for new country
    try {
      const src = map.getSource('doctors')
      if (src) src.setData({ type: 'FeatureCollection', features: buildDoctorFeatures(layers.verified, layers.pending) })
    } catch {}

    // Rebuild mention dots for new country
    try {
      const mentionSrc = map.getSource('mentions')
      if (mentionSrc) {
        const countryMentions = mentions.filter(m => (m.country || 'US') === lookupCountry)
        mentionSrc.setData({ type: 'FeatureCollection', features: countryMentions.map(m => ({
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [m.lng, m.lat] },
          properties: { city: m.city, state: m.state, count: m.count, gap: m.gap ? 1 : 0 },
        })) })
      }
    } catch {}
  }, [lookupCountry])

  // ── Lookup ──
  const [ambiguousOptions, setAmbiguousOptions] = useState<{ city: string; state: string }[] | null>(null)

  const clearResults = useCallback(() => {
    setLookupQuery('')
    setLookupResults(null)
    setLookupLabel('')
    setAmbiguousOptions(null)
    setCouldNotResolve(false)
    setResolvedCity('')
    setResolvedState('')
    setConfidence(undefined)
    setRejectedCandidates(null)
    setShowOtherResults(false)
    setAutoLogResult(null)
    setTimeout(() => { lookupInputRef.current?.focus(); lookupInputRef.current?.select() }, 50)
  }, [])

  const handleSentFromParent = useCallback(() => {
    setLookupQuery('')
    setLookupResults(null)
    setLookupLabel('')
    setAmbiguousOptions(null)
    setCouldNotResolve(false)
    setResolvedCity('')
    setResolvedState('')
    setConfidence(undefined)
    setRejectedCandidates(null)
    setShowOtherResults(false)
    setSessionCount(prev => prev + 1)
    setTodayCount(prev => prev + 1)
    setTimeout(() => { lookupInputRef.current?.focus(); lookupInputRef.current?.select() }, 50)
  }, [])

  const handleLookup = async (overrideQuery?: string) => {
    const q = overrideQuery || lookupQuery.trim()
    if (!q) return
    setLookupLoading(true)
    setAmbiguousOptions(null)
    setCouldNotResolve(false)
    setShowOtherResults(false)
    setConfidence(undefined)
    setRejectedCandidates(null)
    try {
      const r = await lookupNearby(q, lookupCountry)

      if (r.couldNotResolve === true) {
        setCouldNotResolve(true)
        setLookupResults(null)
        setLookupLabel('')
        setLookupLoading(false)
        return
      }

      if (r.detectedCountry && r.detectedCountry !== lookupCountry) {
        setLookupCountry(r.detectedCountry)
        try { localStorage.setItem('nc_lookup_country', r.detectedCountry) } catch {}
        setLookupLabel(`Detected ${r.detectedCountry} postal code. ${r.label}`)
      } else if (r.ambiguous && r.ambiguous.length > 0) {
        setAmbiguousOptions(r.ambiguous)
        setLookupLabel(r.label)
        setLookupResults(null)
        setLookupLoading(false)
        return
      } else {
        setLookupLabel(r.label)
      }
      setLookupResults(r.doctors)
      setConfidence(r.confidence)
      setRejectedCandidates(r.rejectedCandidates || null)
      setResolvedCity(r.resolvedCity || '')
      setResolvedState(r.resolvedState || '')

      // Auto-log demand if resolved and qualifies
      setAutoLogResult(null)
      if (r.resolvedCity && r.resolvedState && r.resolvedLat && r.resolvedLng && !r.ambiguous && !r.couldNotResolve && r.confidence !== 'ambiguous') {
        const nearest = r.doctors[0] // sorted by distance
        autoLogDemand({
          city: r.resolvedCity,
          state: r.resolvedState,
          lat: r.resolvedLat, lng: r.resolvedLng,
          country: lookupCountry,
          nearestDoctorId: nearest?.id,
          nearestDoctorName: nearest ? `${nearest.first_name} ${nearest.last_name}` : undefined,
          nearestDistanceMi: nearest?.distance_miles,
          doctorCount: r.doctors.length,
        }).then(result => {
          if (result.logged && result.id) {
            setAutoLogResult({ id: result.id, reason: result.reason || '' })
          }
        }).catch(() => {})
      }
    } catch { setLookupLabel('Lookup failed'); setLookupResults([]) }
    setLookupLoading(false)
    setTimeout(() => { lookupInputRef.current?.focus(); lookupInputRef.current?.select() }, 50)
  }

  const handlePickAmbiguous = (city: string, state: string) => {
    const q = `${city}, ${state}`
    setLookupQuery(q)
    setAmbiguousOptions(null)
    handleLookup(q)
  }
  const sortedLookupResults = lookupResults ? [...lookupResults].sort((a, b) => {
    if (lookupSort === 'distance') return a.distance_miles - b.distance_miles
    if (lookupSort === 'name') return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
    return ({ verified: 0, pending: 1 }[a.verification_status] ?? 2) - ({ verified: 0, pending: 1 }[b.verification_status] ?? 2)
  }) : null

  // Auto-select: first result is "the pick", rest are secondary
  const pickDoctor = sortedLookupResults && sortedLookupResults.length > 0 ? sortedLookupResults[0] : null
  const otherDoctors = sortedLookupResults && sortedLookupResults.length > 1 ? sortedLookupResults.slice(1) : []

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const inInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable

      if (e.key === '/' && !inInput) {
        e.preventDefault()
        lookupInputRef.current?.focus()
        lookupInputRef.current?.select()
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        clearResults()
        return
      }
      if (inInput) return
      if (e.key === '1' && replyBtnRef.current) {
        e.preventDefault()
        replyBtnRef.current.click()
        return
      }
      if (e.key === '2' && dmBtnRef.current) {
        e.preventDefault()
        dmBtnRef.current.click()
        return
      }
      if (e.key === 'Enter' && sentBtnRef.current) {
        e.preventDefault()
        sentBtnRef.current.click()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [clearResults])

  const invisibleDocs = countryDoctors.filter(d => d.pin_status === 'invisible')
  const missingCountryDocs = doctors.filter(d => d.missing_country)
  const countryVerified = countryDoctors.filter(d => d.pin_status === 'verified').length
  const countryPending = countryDoctors.filter(d => d.pin_status === 'pending').length
  const countryInvisible = invisibleDocs.length
  const countryView = COUNTRY_VIEWS[lookupCountry] || COUNTRY_VIEWS.US
  const anyOn = Object.values(layers).some(Boolean)
  const allOn = Object.values(layers).every(Boolean)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ══════ LOOKUP SECTION (top) ══════ */}
      <div className="px-4 py-4 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <p className="text-xs font-bold text-white/60 uppercase tracking-wider">Doctor Lookup</p>
            <Link href="/admin/coverage/mentions" className="text-[10px] font-bold text-cyan-400/70 hover:text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-lg">+ Mentions</Link>
            <Link href="/admin/coverage/templates" className="text-[10px] font-bold text-white/40 hover:text-white/70 bg-white/5 px-2 py-1 rounded-lg">Templates</Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-white/30">Session: {sessionCount} · Today: {todayCount}</span>
            <select value={lookupCountry} onChange={e => {
              setLookupCountry(e.target.value)
              try { localStorage.setItem('nc_lookup_country', e.target.value) } catch {}
              setLookupResults(null); setLookupLabel(''); setAmbiguousOptions(null); setCouldNotResolve(false)
            }} className="bg-white/5 border border-white/10 rounded-lg text-base text-white/60 px-2 py-1">
              <option value="US">🇺🇸 US</option>
              <option value="CA">🇨🇦 Canada</option>
              <option value="GB">🇬🇧 UK</option>
              <option value="NZ">🇳🇿 NZ</option>
              <option value="AU">🇦🇺 Australia</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input type="text" placeholder={
              lookupCountry === 'US' ? "29651 or Greenville, SC" :
              lookupCountry === 'CA' ? "V5K 1A1 or Vancouver, BC" :
              lookupCountry === 'GB' ? "SW1A 1AA or Manchester" :
              lookupCountry === 'NZ' ? "1010 or Auckland" :
              lookupCountry === 'AU' ? "3000 or Melbourne, VIC" : "City or postal code"
            } value={lookupQuery}
              ref={lookupInputRef}
              onChange={e => setLookupQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
              className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-base placeholder:text-white/25 focus:outline-none focus:border-neuro-orange" />
          </div>
          <button onClick={() => handleLookup()} disabled={lookupLoading || !lookupQuery.trim()}
            className="px-4 py-3 bg-neuro-orange text-white rounded-xl font-bold text-base disabled:opacity-50">
            {lookupLoading ? '...' : 'Search'}
          </button>
        </div>

        {/* Could not resolve - RED band */}
        {couldNotResolve && (
          <div className="bg-red-500/20 border border-red-500/40 rounded-xl px-4 py-3 mb-3">
            <p className="text-sm font-bold text-red-400">We could not find that location. Try a postal code instead.</p>
          </div>
        )}

        {/* Auto-log notification */}
        {autoLogResult && (
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl px-3 py-2 mb-2 flex items-center justify-between">
            <span className="text-[11px] text-cyan-400">{autoLogResult.reason}</span>
            <button
              onClick={async () => {
                await undoAutoLogDemand(autoLogResult.id)
                setAutoLogResult(null)
              }}
              className="text-[11px] text-cyan-400/60 hover:text-cyan-300 ml-3 shrink-0"
            >
              Undo
            </button>
          </div>
        )}

        {/* Resolution label + confidence indicators */}
        {lookupLabel && !couldNotResolve && (
          <div className="mb-2">
            <p className="text-xs text-white/50">{lookupLabel}</p>
            {confidence === 'dominant' && rejectedCandidates && rejectedCandidates.length > 0 && resolvedCity && (
              <p className="text-[10px] text-white/30 mt-1">
                Matched to {resolvedCity}, {resolvedState}. Also exists in {rejectedCandidates.map(rc => rc.state).join(', ')}.
              </p>
            )}
            {confidence === 'approximate' && (
              <p className="text-[10px] text-amber-400/70 mt-1">Approximate match. Double-check this is right.</p>
            )}
          </div>
        )}

        {/* Ambiguous options */}
        {ambiguousOptions && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ambiguousOptions.map((opt, i) => (
              <button key={i} onClick={() => handlePickAmbiguous(opt.city, opt.state)}
                className="px-3 py-1.5 bg-white/10 hover:bg-neuro-orange/30 border border-white/10 hover:border-neuro-orange rounded-lg text-xs font-bold text-white transition-colors">
                {opt.city}, {opt.state}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        {!couldNotResolve && sortedLookupResults && (sortedLookupResults.length > 0 ? (
          <>
            <div className="flex gap-2 mb-2">
              {(['distance', 'name', 'tier'] as const).map(s => (
                <button key={s} onClick={() => setLookupSort(s)} className={`px-2 py-1 rounded text-[10px] font-bold ${lookupSort === s ? 'bg-neuro-orange text-white' : 'text-white/40'}`}>
                  {s === 'distance' ? 'Nearest' : s === 'name' ? 'A-Z' : 'Status'}
                </button>
              ))}
            </div>

            {/* Primary pick (first/nearest doctor) */}
            {pickDoctor && (
              <LookupResultRow
                key={pickDoctor.id}
                doctor={pickDoctor}
                searchedCity={lookupQuery}
                templates={templates}
                sentDoctorIds={sentDoctorIds}
                farThreshold={farThreshold}
                isPick
                onSent={handleSentFromParent}
                replyBtnRef={replyBtnRef}
                dmBtnRef={dmBtnRef}
                sentBtnRef={sentBtnRef}
              />
            )}

            {/* Other results */}
            {otherDoctors.length > 0 && (
              <div className="mt-2">
                <button onClick={() => setShowOtherResults(!showOtherResults)}
                  className="text-[11px] text-white/40 hover:text-white/60 font-bold flex items-center gap-1">
                  {showOtherResults ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showOtherResults ? 'Hide other options' : `Show other options (${otherDoctors.length})`}
                </button>
                {showOtherResults && (
                  <div className="space-y-1.5 mt-2 max-h-[40vh] overflow-y-auto">
                    {otherDoctors.map(d => (
                      <LookupResultRow key={d.id} doctor={d} searchedCity={lookupQuery} templates={templates} sentDoctorIds={sentDoctorIds} farThreshold={farThreshold} onSent={handleSentFromParent} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            {resolvedCity ? (
              <p className="text-xs text-white/30 mb-3">We found {resolvedCity}, {resolvedState} but no doctor within 100 miles.</p>
            ) : (
              <p className="text-xs text-white/30 mb-3">No doctors within 100 miles</p>
            )}
            <WaitlistReplyButtons searchedCity={lookupQuery} templates={templates} />
          </div>
        ))}

        {/* Keyboard shortcuts */}
        <div className="mt-4 pt-3 border-t border-white/5">
          <p className="text-[10px] text-white/20">
            <span className="font-bold">/</span> focus search &nbsp;
            <span className="font-bold">1</span> copy reply &nbsp;
            <span className="font-bold">2</span> copy DM &nbsp;
            <span className="font-bold">Enter</span> mark sent &nbsp;
            <span className="font-bold">Esc</span> clear
          </p>
        </div>
      </div>

      {/* ══════ COLLAPSIBLE MAP SECTION ══════ */}
      <div className="border-b border-white/10">
        <button onClick={() => setMapCollapsed(!mapCollapsed)}
          className="w-full px-4 py-2 flex items-center justify-between text-white/50 hover:text-white/70 transition-colors">
          <span className="text-xs font-bold flex items-center gap-1.5">
            <MapIcon className="w-3.5 h-3.5" />
            {mapCollapsed ? 'Show Map' : 'Hide Map'}
          </span>
          {mapCollapsed ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>

        {!mapCollapsed && (
          <>
            {/* Stats bar */}
            <div className="px-4 py-3 border-t border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-lg font-bold">Coverage Map</h1>
                <button onClick={() => setShowStatsPanel(!showStatsPanel)} className="text-white/50 text-xs flex items-center gap-1">
                  {showStatsPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  {showStatsPanel ? 'Hide' : 'Stats'}
                </button>
              </div>
              {showStatsPanel && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-2">
                    <StatCard label="Verified" value={countryVerified} color="text-green-400" sub="Live, searchable" />
                    <StatCard label="Pending" value={countryPending} color="text-amber-400" sub="Awaiting approval" />
                    <StatCard label="Invisible" value={countryInvisible} color="text-red-400" sub="No coordinates" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {lookupCountry === 'US' ? (
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">States With a Doctor</p>
                        <p className="text-xl font-bold">{stats.statesWithDoctor.length}<span className="text-white/30 text-sm"> / {ALL_US_STATES.length}</span></p>
                        {stats.statesWithout.length > 0 && <p className="text-[10px] text-red-400/70 mt-1">Missing: {stats.statesWithout.join(', ')}</p>}
                      </div>
                    ) : (
                      <div className="bg-white/5 rounded-xl p-3">
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{countryView.label} With a Doctor</p>
                        <p className="text-xl font-bold">{new Set(countryDoctors.filter(d => d.state && d.pin_status !== 'invisible').map(d => d.state)).size}</p>
                        <p className="text-[10px] text-white/25 mt-0.5">{countryDoctors.filter(d => d.pin_status !== 'invisible').length} doctors total</p>
                      </div>
                    )}
                    <div className="bg-white/5 rounded-xl p-3">
                      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Demand Signals</p>
                      {lookupCountry === 'US' ? (
                        <>
                          <p className="text-xl font-bold">{stats.confirmedSubscribers} <span className="text-white/30 text-sm">waitlist</span></p>
                          {stats.pendingSubscribers > 0 && <p className="text-xs text-purple-400/70 mt-0.5">{stats.pendingSubscribers} pending</p>}
                          {stats.totalMentions > 0 && <p className="text-xs text-cyan-400/70 mt-0.5">{stats.totalMentions} comment mentions</p>}
                        </>
                      ) : (
                        <p className="text-sm text-white/30 mt-1">Switch to US for demand data</p>
                      )}
                    </div>
                  </div>
                  {stats.recruitMarkets.length > 0 && (
                    <MarketPanel
                      title="Recruit Here"
                      subtitle="Demand with no doctor within 50 miles."
                      markets={stats.recruitMarkets}
                      color="rose"
                    />
                  )}
                  {stats.coveredMarkets.length > 0 && (
                    <MarketPanel
                      title="Already Covered"
                      subtitle="Demand where a doctor is nearby. Reply to these people."
                      markets={stats.coveredMarkets}
                      color="green"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Layer toggles */}
            <div className="px-4 py-2 border-t border-white/10">
              <div className="flex items-center gap-1.5 flex-wrap">
                {LAYER_CONFIG.map(l => (
                  <button key={l.key} onClick={() => toggleLayer(l.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all min-h-[32px] ${
                      layers[l.key]
                        ? 'bg-white/15 text-white border border-white/20'
                        : 'bg-transparent text-white/30 border border-white/5'
                    }`}>
                    <span className="w-2.5 h-2.5 rounded-full shrink-0 transition-opacity"
                      style={{ background: l.color, opacity: layers[l.key] ? (l.opacity || 1) : 0.2 }} />
                    <span className="hidden sm:inline">{l.label}</span>
                    <span className="sm:hidden">{l.label.split(' ')[0]}</span>
                  </button>
                ))}
                <span className="w-px h-5 bg-white/10 mx-0.5" />
                <button onClick={allOn ? hideAll : showAll}
                  className="px-2 py-1.5 text-[10px] font-bold text-white/40 hover:text-white/70 transition-colors">
                  {allOn ? 'Hide all' : 'Show all'}
                </button>
              </div>
            </div>

            {/* Map */}
            <div ref={mapRef} className="w-full" style={{ height: 'min(60vh, 500px)' }} />

            {/* Invisible doctors */}
            {invisibleDocs.length > 0 && (
              <div className="px-4 py-3 border-t border-white/10">
                <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {invisibleDocs.length} doctors not on map</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {invisibleDocs.map(d => (
                    <Link key={d.id} href={`/admin/directory?search=${encodeURIComponent([d.first_name, d.last_name].filter(Boolean).join(' '))}`} className="text-xs text-white/50 hover:text-white/80">
                      {[d.first_name, d.last_name].filter(Boolean).join(' ') || d.clinic_name}<span className="text-white/20 ml-1">({d.city}, {d.state})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {missingCountryDocs.length > 0 && (
              <div className="px-4 py-3 border-t border-white/10">
                <p className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {missingCountryDocs.length} doctor{missingCountryDocs.length > 1 ? 's' : ''} missing country — defaulting to US</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1">
                  {missingCountryDocs.map(d => (
                    <Link key={d.id} href={`/admin/directory?search=${encodeURIComponent([d.first_name, d.last_name].filter(Boolean).join(' '))}`} className="text-xs text-yellow-400/60 hover:text-yellow-400">
                      {[d.first_name, d.last_name].filter(Boolean).join(' ')}<span className="text-white/20 ml-1">({d.city}, {d.state})</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function fillTemplate(body: string, vars: Record<string, string>): string {
  return body.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`)
}

function parseSearchCity(searchedCity: string): { city: string; state?: string } {
  const parts = searchedCity.split(',').map(p => p.trim())
  return { city: parts[0] || searchedCity, state: parts[1] || undefined }
}

function TemplateCopyButton({ label, text, templateId, searchedCity, doctorId, color = 'white/5' }: {
  label: string; text: string; templateId: string; searchedCity: string; doctorId?: string; color?: string
}) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
      const { city, state } = parseSearchCity(searchedCity)
      logReply(templateId, city, state, doctorId)
    } catch {}
  }
  return (
    <button onClick={handleCopy}
      className={`flex items-center gap-1 px-2 py-1 bg-${color} hover:bg-white/10 rounded-lg text-[10px] font-bold text-white/50 hover:text-white/80 transition-colors`}>
      {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied</> : <><Copy className="w-3 h-3" /> {label}</>}
    </button>
  )
}

// Round distance humanly: nearest 5 for > 20mi, nearest 1 for <= 20
function humanDistance(miles: number): string {
  if (miles <= 20) return String(Math.round(miles))
  return String(Math.round(miles / 5) * 5)
}

function LookupResultRow({ doctor: d, searchedCity, templates, sentDoctorIds, farThreshold, isPick, onSent, replyBtnRef, dmBtnRef, sentBtnRef }: {
  doctor: LookupResult; searchedCity: string; templates: ReplyTemplate[]; sentDoctorIds: Set<string>; farThreshold: number;
  isPick?: boolean; onSent?: () => void;
  replyBtnRef?: React.RefObject<HTMLButtonElement | null>;
  dmBtnRef?: React.RefObject<HTMLButtonElement | null>;
  sentBtnRef?: React.RefObject<HTMLButtonElement | null>;
}) {
  // copiedReply/copiedDM persist until row unmounts (no setTimeout reset)
  const [copiedReply, setCopiedReply] = useState(false)
  const [copiedDM, setCopiedDM] = useState(false)
  const [copiedHandle, setCopiedHandle] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedReqLink, setCopiedReqLink] = useState(false)
  const [localIntroCount, setLocalIntroCount] = useState(d.intro_count)
  const [justSent, setJustSent] = useState(false)

  const profileUrl = `https://neurochiro.co/directory/${d.slug || d.id}`
  const contactRequestUrl = `https://neurochiro.co/contact-request?doctor=${d.slug || d.id}&source=dm_outreach`
  const doctorName = `Dr. ${d.first_name} ${d.last_name}`.trim()
  const handle = d.instagram_handle || ''
  const isFar = d.distance_miles >= farThreshold

  // Pick the right templates based on distance
  const commentTplId = isFar ? 'doctor_comment_far' : 'doctor_comment'
  const dmTplId = isFar ? 'doctor_dm_far' : 'doctor_dm'
  const commentTpl = templates.find(t => t.id === commentTplId)
  const dmTpl = templates.find(t => t.id === dmTplId)

  const vars: Record<string, string> = {
    handle, city: d.city || '', state: d.state || '',
    doctor_name: doctorName, doctor_city: d.city || '',
    profile_url: profileUrl, contact_request_url: contactRequestUrl,
    distance: humanDistance(d.distance_miles),
  }
  const replyText = handle && commentTpl ? fillTemplate(commentTpl.body, vars) : ''
  const dmText = dmTpl ? fillTemplate(dmTpl.body, vars) : `Hey! I found a nervous system chiropractor near you.\n\n${doctorName} — ${d.city}, ${d.state} (${d.distance_miles} mi)\nProfile: ${profileUrl}\n\nWant their office to reach out to you? Leave your name and number here and I'll pass it along:\n${contactRequestUrl}`

  const quickCopy = async (text: string, setter: (v: boolean) => void) => {
    try { await navigator.clipboard.writeText(text); setter(true); setTimeout(() => setter(false), 1500) } catch {}
  }

  const handleSent = async () => {
    setLocalIntroCount(prev => prev + 1)
    setJustSent(true)
    const { city: c, state: s } = parseSearchCity(searchedCity)
    await logReply('sent_to_patient', c, s, d.id)
    // After logging, call parent onSent to clear and refocus
    if (onSent) onSent()
  }

  const pickReason = isPick ? `Closest verified doctor. ${d.distance_miles} miles.` : undefined

  return (
    <div className={`rounded-xl px-3 py-2 ${isPick ? 'bg-neuro-orange/10 border-2 border-neuro-orange/30' : localIntroCount > 0 ? 'bg-green-500/5 border border-green-500/20' : 'bg-white/5'}`}>
      {/* Pick badge */}
      {isPick && pickReason && (
        <p className="text-[10px] font-bold text-neuro-orange mb-1">{pickReason}</p>
      )}
      {/* Row 1: Name, handle, completeness dots, distance, intro count */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <p className={`font-bold text-white truncate ${isPick ? 'text-base' : 'text-sm'}`}>{doctorName}</p>
          {handle ? (
            <button onClick={() => quickCopy(handle, setCopiedHandle)}
              className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium shrink-0 flex items-center gap-0.5"
              title="Copy handle">
              {handle} {copiedHandle ? <Check className="w-2.5 h-2.5 text-green-400" /> : <Copy className="w-2 h-2 opacity-30" />}
            </button>
          ) : (
            <span className="text-[10px] text-red-400/60 shrink-0">no IG</span>
          )}
          <span className="flex items-center gap-0.5 shrink-0" title="Photo · Booking · Hours">
            <span className={`w-1.5 h-1.5 rounded-full ${d.has_photo ? 'bg-green-400' : 'bg-red-400/60'}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${d.has_booking ? 'bg-green-400' : 'bg-red-400/60'}`} />
            <span className={`w-1.5 h-1.5 rounded-full ${d.has_hours ? 'bg-green-400' : 'bg-red-400/60'}`} />
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {localIntroCount > 0 && <span className="text-[10px] text-white/30" title="Times sent">{localIntroCount} sent</span>}
          <span className={`font-bold text-neuro-orange ${isPick ? 'text-sm' : 'text-xs'}`}>{d.distance_miles} mi</span>
        </div>
      </div>
      {/* Row 2: Clinic, city */}
      <p className="text-[11px] text-white/40 truncate mt-0.5">{d.clinic_name ? `${d.clinic_name} · ` : ''}{d.city}, {d.state}</p>
      {/* Row 3: Primary actions (Reply, DM, Sent) + secondary (profile link, request link) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1.5 mt-1.5">
        {handle && (
          <button
            ref={isPick ? replyBtnRef : undefined}
            onClick={() => { quickCopy(replyText, () => {}); setCopiedReply(true); logReply(commentTplId, vars.city, vars.state, d.id) }}
            className={`flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg text-sm sm:text-[11px] font-bold transition-colors ${
              copiedReply ? 'bg-green-500/20 text-green-400'
              : isFar ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-400' : 'bg-neuro-orange/20 hover:bg-neuro-orange/30 text-neuro-orange'
            }`}>
            {copiedReply ? <><Check className="w-4 h-4 sm:w-3 sm:h-3 text-green-400" /> Copied</> : <><Copy className="w-4 h-4 sm:w-3 sm:h-3" /> {isFar ? '1. Reply (far)' : '1. Reply'}</>}
          </button>
        )}
        <button
          ref={isPick ? dmBtnRef : undefined}
          onClick={() => { quickCopy(dmText, () => {}); setCopiedDM(true); logReply(dmTplId, vars.city, vars.state, d.id) }}
          className={`flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg text-sm sm:text-[11px] font-bold transition-colors ${
            copiedDM ? 'bg-green-500/20 text-green-400'
            : isFar ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-400' : 'bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-400'
          }`}>
          {copiedDM ? <><Check className="w-4 h-4 sm:w-3 sm:h-3 text-green-400" /> Copied</> : <><Copy className="w-4 h-4 sm:w-3 sm:h-3" /> {isFar ? '2. DM (far)' : '2. DM'}</>}
        </button>
        <button
          ref={isPick ? sentBtnRef : undefined}
          onClick={handleSent}
          className={`flex items-center justify-center gap-1.5 px-3 min-h-[44px] sm:min-h-0 sm:py-1 rounded-lg text-sm sm:text-[10px] font-bold transition-colors ${
            justSent ? 'bg-green-500/20 text-green-400' : 'bg-white/5 hover:bg-white/10 text-white/50 hover:text-white/80'
          }`}>
          {justSent ? <><Check className="w-4 h-4 sm:w-3 sm:h-3" /> Logged</> : <><Send className="w-4 h-4 sm:w-3 sm:h-3" /> Sent</>}
        </button>
        <span className="flex items-center gap-1 ml-auto">
          <button onClick={() => quickCopy(profileUrl, setCopiedUrl)} title="Copy profile link"
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/30 hover:text-white/60 transition-colors">
            {copiedUrl ? <Check className="w-3 h-3 text-green-400" /> : <ExternalLink className="w-3 h-3" />}
          </button>
          <button onClick={() => quickCopy(contactRequestUrl, setCopiedReqLink)} title="Copy contact request link"
            className="p-1 bg-white/5 hover:bg-white/10 rounded text-white/30 hover:text-white/60 transition-colors">
            {copiedReqLink ? <Check className="w-3 h-3 text-green-400" /> : <MessageSquare className="w-3 h-3" />}
          </button>
        </span>
      </div>
    </div>
  )
}

function WaitlistReplyButtons({ searchedCity, templates }: { searchedCity: string; templates: ReplyTemplate[] }) {
  const waitlistDm = templates.find(t => t.id === 'waitlist_dm')
  const waitlistComment = templates.find(t => t.id === 'waitlist_comment')
  const { city } = parseSearchCity(searchedCity)

  return (
    <>
      {(waitlistDm || waitlistComment) && (
        <div className="flex items-center justify-center gap-2">
          {waitlistDm && (
            <TemplateCopyButton label="Copy waitlist DM" text={fillTemplate(waitlistDm.body, { city })} templateId="waitlist_dm" searchedCity={searchedCity} />
          )}
          {waitlistComment && (
            <TemplateCopyButton label="Copy comment" text={fillTemplate(waitlistComment.body, { city })} templateId="waitlist_comment" searchedCity={searchedCity} />
          )}
        </div>
      )}
    </>
  )
}

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{sub}</p>}
    </div>
  )
}

function MarketPanel({ title, subtitle, markets, color }: {
  title: string; subtitle: string; markets: MarketCluster[]; color: 'rose' | 'green'
}) {
  const [addingTo, setAddingTo] = useState<string | null>(null)
  const [leadInput, setLeadInput] = useState('')
  const [saving, setSaving] = useState(false)

  const bgClass = color === 'rose' ? 'bg-rose-500/10 border-rose-500/20' : 'bg-green-500/10 border-green-500/20'
  const titleClass = color === 'rose' ? 'text-rose-400' : 'text-green-400'
  const badgeClass = color === 'rose' ? 'text-rose-400' : 'text-green-400'

  const handleAddLead = async (market: MarketCluster) => {
    if (!leadInput.trim()) return
    setSaving(true)
    // Use the first city in the cluster for storage
    const [city, state] = market.cities[0].split(', ')
    await addMarketLead(city, state, leadInput.trim())
    market.leads.push(leadInput.trim())
    setLeadInput('')
    setAddingTo(null)
    setSaving(false)
  }

  return (
    <div className={`border rounded-xl p-3 ${bgClass}`}>
      <p className={`text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1 ${titleClass}`}>
        <AlertTriangle className="w-3 h-3" /> {title}
      </p>
      <p className="text-[10px] text-white/40 mb-3">{subtitle}</p>
      <div className="space-y-2.5">
        {markets.map((m, i) => (
          <div key={i} className="bg-black/20 rounded-lg px-3 py-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold text-white">{m.name}</span>
                <span className={`ml-2 text-xs font-bold ${badgeClass}`}>{m.total}</span>
                {m.waitlist > 0 && m.mentions > 0 ? (
                  <span className="text-[10px] text-white/30 ml-1">({m.waitlist} waitlist + {m.mentions} mentions)</span>
                ) : m.waitlist > 0 ? (
                  <span className="text-[10px] text-white/30 ml-1">({m.waitlist} waitlist)</span>
                ) : (
                  <span className="text-[10px] text-white/30 ml-1">({m.mentions} mentions)</span>
                )}
              </div>
              <button
                onClick={() => setAddingTo(addingTo === m.name ? null : m.name)}
                className="text-[10px] text-white/30 hover:text-white/60 shrink-0 px-1"
                title="Add lead"
              >+ lead</button>
            </div>
            {m.cities.length > 1 && (
              <p className="text-[10px] text-white/25 mt-1 leading-relaxed">{m.cities.join(' · ')}</p>
            )}
            {m.leads.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {m.leads.map((l, li) => (
                  <span key={li} className="text-[10px] bg-white/10 text-cyan-300 px-1.5 py-0.5 rounded font-medium">{l}</span>
                ))}
              </div>
            )}
            {addingTo === m.name && (
              <div className="flex gap-1.5 mt-2">
                <input
                  type="text"
                  value={leadInput}
                  onChange={e => setLeadInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddLead(m) }}
                  placeholder="@handle or name"
                  className="flex-1 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-white text-[11px] placeholder:text-white/20 focus:outline-none focus:border-cyan-400"
                  autoFocus
                />
                <button
                  onClick={() => handleAddLead(m)}
                  disabled={saving || !leadInput.trim()}
                  className="px-3 py-1.5 bg-cyan-500 text-white rounded-lg text-[10px] font-bold disabled:opacity-50"
                >Save</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const ALL_US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
]
