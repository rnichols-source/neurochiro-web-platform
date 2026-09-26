"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Search, AlertTriangle, ExternalLink, Globe, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { CoverageDoctor, DemandZip, CoverageStats, MentionCity, MarketCluster, LookupResult, lookupNearby, addMarketLead } from "./actions"

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

function loadSavedLayers(): Record<LayerKey, boolean> {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved)
  } catch {}
  return { verified: true, pending: true, confirmedSub: true, pendingSub: true, gaps: true, mentions: true }
}

// ── Main Component ──

export default function CoverageMapClient({
  doctors, demand, stats, mentions,
}: {
  doctors: CoverageDoctor[]
  demand: DemandZip[]
  stats: CoverageStats
  mentions: MentionCity[]
}) {
  const [layers, setLayers] = useState<Record<LayerKey, boolean>>(loadSavedLayers)
  const [showStatsPanel, setShowStatsPanel] = useState(true)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null)
  const [lookupLabel, setLookupLabel] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSort, setLookupSort] = useState<'distance' | 'name' | 'tier'>('distance')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const mapReadyRef = useRef(false)

  // Persist layer selections
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(layers)) } catch {}
  }, [layers])

  const toggleLayer = (key: LayerKey) => setLayers(prev => ({ ...prev, [key]: !prev[key] }))
  const showAll = () => setLayers({ verified: true, pending: true, confirmedSub: true, pendingSub: true, gaps: true, mentions: true })
  const hideAll = () => setLayers({ verified: false, pending: false, confirmedSub: false, pendingSub: false, gaps: false, mentions: false })

  // ── Build doctor features filtered by current toggles ──
  const buildDoctorFeatures = useCallback((showVerified: boolean, showPending: boolean) => {
    return doctors
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
  }, [doctors])

  // ── Map init ──
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return
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

        // Mentions source
        const mentionFeatures = mentions.map(m => ({
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
    return () => { mapInstanceRef.current?.remove(); mapInstanceRef.current = null }
  }, [])

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

  // ── Lookup ──
  const [ambiguousOptions, setAmbiguousOptions] = useState<{ city: string; state: string }[] | null>(null)

  const handleLookup = async (overrideQuery?: string) => {
    const q = overrideQuery || lookupQuery.trim()
    if (!q) return
    setLookupLoading(true)
    setAmbiguousOptions(null)
    try {
      const r = await lookupNearby(q)
      if (r.ambiguous && r.ambiguous.length > 0) {
        setAmbiguousOptions(r.ambiguous)
        setLookupLabel(r.label)
        setLookupResults(null)
      } else {
        setLookupResults(r.doctors)
        setLookupLabel(r.label)
      }
    } catch { setLookupLabel('Lookup failed'); setLookupResults([]) }
    setLookupLoading(false)
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

  const invisibleDocs = doctors.filter(d => d.pin_status === 'invisible')
  const anyOn = Object.values(layers).some(Boolean)
  const allOn = Object.values(layers).every(Boolean)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Stats bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold">Coverage Map</h1>
            <Link href="/admin/coverage/mentions" className="text-[10px] font-bold text-cyan-400/70 hover:text-cyan-400 bg-cyan-400/10 px-2 py-1 rounded-lg">+ Mentions</Link>
          </div>
          <button onClick={() => setShowStatsPanel(!showStatsPanel)} className="text-white/50 text-xs flex items-center gap-1">
            {showStatsPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showStatsPanel ? 'Hide' : 'Stats'}
          </button>
        </div>
        {showStatsPanel && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Verified" value={stats.verified} color="text-green-400" sub="Live, searchable" />
              <StatCard label="Pending" value={stats.pending} color="text-amber-400" sub="Awaiting approval" />
              <StatCard label="Invisible" value={stats.invisible} color="text-red-400" sub="No coordinates" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">States With a Doctor</p>
                <p className="text-xl font-bold">{stats.statesWithDoctor.length}<span className="text-white/30 text-sm"> / {ALL_US_STATES.length}</span></p>
                {stats.statesWithout.length > 0 && <p className="text-[10px] text-red-400/70 mt-1">Missing: {stats.statesWithout.join(', ')}</p>}
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Demand Signals</p>
                <p className="text-xl font-bold">{stats.confirmedSubscribers} <span className="text-white/30 text-sm">waitlist</span></p>
                {stats.pendingSubscribers > 0 && <p className="text-xs text-purple-400/70 mt-0.5">{stats.pendingSubscribers} pending</p>}
                {stats.totalMentions > 0 && <p className="text-xs text-cyan-400/70 mt-0.5">{stats.totalMentions} comment mentions</p>}
                {stats.internationalCount > 0 && <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1"><Globe className="w-3 h-3" /> {stats.internationalCount} intl doctors</p>}
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
      <div className="px-4 py-2 border-b border-white/10">
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

      {/* Lookup */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Doctor Lookup</p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input type="text" placeholder="City, ZIP, or 'Tulsa, OK'..." value={lookupQuery}
              onChange={e => setLookupQuery(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
              className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-neuro-orange" />
          </div>
          <button onClick={() => handleLookup()} disabled={lookupLoading || !lookupQuery.trim()}
            className="px-4 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm disabled:opacity-50">
            {lookupLoading ? '...' : 'Search'}
          </button>
        </div>
        {lookupLabel && <p className="text-xs text-white/50 mb-2">{lookupLabel}</p>}
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
        {sortedLookupResults && (sortedLookupResults.length > 0 ? (
          <>
            <div className="flex gap-2 mb-2">
              {(['distance', 'name', 'tier'] as const).map(s => (
                <button key={s} onClick={() => setLookupSort(s)} className={`px-2 py-1 rounded text-[10px] font-bold ${lookupSort === s ? 'bg-neuro-orange text-white' : 'text-white/40'}`}>
                  {s === 'distance' ? 'Nearest' : s === 'name' ? 'A-Z' : 'Status'}
                </button>
              ))}
            </div>
            <div className="space-y-1 max-h-[50vh] overflow-y-auto">
              {sortedLookupResults.map(d => (
                <div key={d.id} className="flex items-center gap-3 py-2 px-3 bg-white/5 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">Dr. {d.first_name} {d.last_name}</p>
                    <p className="text-[11px] text-white/40 truncate">{d.clinic_name} - {d.city}, {d.state}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-bold text-neuro-orange">{d.distance_miles} mi</p>
                    <p className={`text-[10px] font-bold ${d.verification_status === 'verified' ? 'text-green-400' : 'text-amber-400'}`}>{d.verification_status}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Link href={`/directory/${d.slug || d.id}`} target="_blank" className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10"><ExternalLink className="w-3 h-3 text-white/50" /></Link>
                    <Link href={`/admin/directory?search=${encodeURIComponent(`${d.first_name} ${d.last_name}`)}`} target="_blank" className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10"><MapPin className="w-3 h-3 text-white/50" /></Link>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : <p className="text-xs text-white/30 py-4 text-center">No doctors within 100 miles</p>)}
      </div>
    </div>
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
