"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { MapPin, Search, Users, AlertTriangle, Eye, EyeOff, ExternalLink, Globe, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { CoverageDoctor, DemandZip, CoverageStats, LookupResult, lookupNearby } from "./actions"

// ── Pin colors ──
const PIN_COLORS = {
  verified: '#22c55e',   // green
  pending: '#f59e0b',    // amber
  invisible: '#ef4444',  // red
}

const DEMAND_COLOR = '#8b5cf6'       // purple for subscriber ZIPs
const GAP_COLOR = '#f43f5e'          // rose for unserved gaps

// ── Main Component ──

export default function CoverageMapClient({
  doctors,
  demand,
  stats,
}: {
  doctors: CoverageDoctor[]
  demand: DemandZip[]
  stats: CoverageStats
}) {
  const [showDemand, setShowDemand] = useState(false)
  const [showStatsPanel, setShowStatsPanel] = useState(true)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupResults, setLookupResults] = useState<LookupResult[] | null>(null)
  const [lookupLabel, setLookupLabel] = useState('')
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupSort, setLookupSort] = useState<'distance' | 'name' | 'tier'>('distance')
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersSourceRef = useRef<boolean>(false)

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
        container: mapRef.current!,
        style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
        center: [-96, 38],
        zoom: 3.8,
        attributionControl: false,
      })

      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right')

      map.on('load', () => {
        mapInstanceRef.current = map
        addDoctorMarkers(map)
      })
    }
    document.head.appendChild(script)

    return () => {
      mapInstanceRef.current?.remove()
      mapInstanceRef.current = null
    }
  }, [])

  // ── Doctor markers ──
  const addDoctorMarkers = useCallback((map: any) => {
    if (markersSourceRef.current) return
    markersSourceRef.current = true

    const maplibregl = (window as any).maplibregl

    // Build features
    const features = doctors
      .filter(d => d.pin_status !== 'invisible' && d.latitude && d.longitude && d.latitude !== 0)
      .map(d => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.longitude!, d.latitude!] },
        properties: {
          id: d.id,
          name: `Dr. ${d.first_name || ''} ${d.last_name || ''}`.trim(),
          clinic: d.clinic_name || '',
          city: d.city || '',
          state: d.state || '',
          slug: d.slug || '',
          tier: d.membership_tier || '',
          status: d.pin_status,
          created: d.created_at ? new Date(d.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '',
          color: PIN_COLORS[d.pin_status as keyof typeof PIN_COLORS] || PIN_COLORS.verified,
        },
      }))

    // Clustered source — low radius so metros separate at default zoom
    map.addSource('doctors', {
      type: 'geojson',
      data: { type: 'FeatureCollection', features },
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 25,
    })

    // Cluster circles
    map.addLayer({
      id: 'doctor-clusters',
      type: 'circle',
      source: 'doctors',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#D66829',
        'circle-radius': ['step', ['get', 'point_count'], 14, 5, 18, 15, 24],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#fff',
      },
    })

    // Cluster count labels
    map.addLayer({
      id: 'doctor-cluster-count',
      type: 'symbol',
      source: 'doctors',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-size': 13,
        'text-font': ['Open Sans Bold'],
      },
      paint: { 'text-color': '#ffffff' },
    })

    // Individual doctor dots
    map.addLayer({
      id: 'doctor-dots',
      type: 'circle',
      source: 'doctors',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': ['get', 'color'],
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 5, 8, 7, 14, 10],
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
      },
    })

    // Click cluster to zoom
    map.on('click', 'doctor-clusters', (e: any) => {
      const features = map.queryRenderedFeatures(e.point, { layers: ['doctor-clusters'] })
      if (!features.length) return
      const clusterId = features[0].properties.cluster_id
      map.getSource('doctors').getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
        if (err) return
        map.easeTo({ center: features[0].geometry.coordinates, zoom })
      })
    })

    // Click doctor dot → popup
    map.on('click', 'doctor-dots', (e: any) => {
      if (!e.features?.length) return
      const f = e.features[0]
      const p = f.properties
      const coords = f.geometry.coordinates.slice()

      const statusBadge = p.status === 'verified'
        ? '<span style="color:#22c55e;font-size:11px;font-weight:700;">Verified</span>'
        : '<span style="color:#f59e0b;font-size:11px;font-weight:700;">Pending</span>'

      const html = `
        <div style="padding:14px;font-family:-apple-system,system-ui,sans-serif;min-width:200px;">
          <div style="font-size:15px;font-weight:700;color:#1E2D3B;margin-bottom:2px;">${p.name}</div>
          <div style="font-size:12px;color:#666;margin-bottom:4px;">${p.clinic}</div>
          <div style="font-size:12px;color:#999;margin-bottom:6px;">${p.city}, ${p.state}</div>
          <div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;">
            ${statusBadge}
            <span style="color:#999;font-size:11px;">Since ${p.created}</span>
          </div>
          <div style="display:flex;gap:6px;">
            <a href="/directory/${p.slug || p.id}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#D66829;color:white;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;">Profile</a>
            <a href="/admin/directory?search=${encodeURIComponent(p.name)}" target="_blank" style="flex:1;text-align:center;padding:8px;background:#1E2D3B;color:white;border-radius:8px;font-size:12px;font-weight:700;text-decoration:none;">Admin</a>
          </div>
        </div>
      `

      new maplibregl.Popup({ offset: 12, maxWidth: '300px', closeButton: true, focusAfterOpen: false })
        .setLngLat(coords)
        .setHTML(html)
        .addTo(map)
    })

    // Cursors
    map.on('mouseenter', 'doctor-dots', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'doctor-dots', () => { map.getCanvas().style.cursor = '' })
    map.on('mouseenter', 'doctor-clusters', () => { map.getCanvas().style.cursor = 'pointer' })
    map.on('mouseleave', 'doctor-clusters', () => { map.getCanvas().style.cursor = '' })
  }, [doctors])

  // ── Demand overlay toggle ──
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map || !map.isStyleLoaded()) return

    const sourceId = 'demand'
    const layerId = 'demand-dots'
    const gapLayerId = 'demand-gaps'

    if (showDemand) {
      if (map.getSource(sourceId)) return // already added

      const features = demand.map(d => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [d.lng, d.lat] },
        properties: {
          zip: d.zip,
          city: d.city,
          state: d.state,
          confirmed: d.confirmed,
          pending: d.pending,
          total: d.confirmed + d.pending,
          gap: d.gap ? 1 : 0,
          // Visual type: gap > confirmed-only > pending-only
          demandType: d.gap ? 'gap' : d.confirmed > 0 ? 'confirmed' : 'pending',
        },
      }))

      map.addSource(sourceId, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features },
      })

      // Confirmed subscriber ZIPs with a doctor nearby (purple, solid)
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'demandType'], 'confirmed'],
        paint: {
          'circle-color': DEMAND_COLOR,
          'circle-radius': ['interpolate', ['linear'], ['get', 'total'], 1, 8, 5, 12, 20, 18],
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      })

      // Pending-only subscriber ZIPs (lighter purple, dashed feel via lower opacity)
      map.addLayer({
        id: 'demand-pending',
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'demandType'], 'pending'],
        paint: {
          'circle-color': DEMAND_COLOR,
          'circle-radius': ['interpolate', ['linear'], ['get', 'total'], 1, 7, 5, 10, 20, 16],
          'circle-opacity': 0.35,
          'circle-stroke-width': 2,
          'circle-stroke-color': DEMAND_COLOR,
          'circle-stroke-opacity': 0.5,
        },
      })

      // Gap ZIPs (no doctor within 50mi) — rose with thick white ring
      map.addLayer({
        id: gapLayerId,
        type: 'circle',
        source: sourceId,
        filter: ['==', ['get', 'demandType'], 'gap'],
        paint: {
          'circle-color': GAP_COLOR,
          'circle-radius': ['interpolate', ['linear'], ['get', 'total'], 1, 10, 5, 14, 20, 22],
          'circle-opacity': 0.85,
          'circle-stroke-width': 3,
          'circle-stroke-color': '#fff',
        },
      })

      // Click any demand dot → popup
      const handleDemandClick = (e: any) => {
        if (!e.features?.length) return
        const p = e.features[0].properties
        const coords = e.features[0].geometry.coordinates.slice()
        const maplibregl = (window as any).maplibregl
        const gapLabel = p.gap === 1
          ? '<div style="color:#f43f5e;font-weight:700;font-size:11px;margin-top:6px;">No doctor within 50 miles</div>'
          : '<div style="color:#22c55e;font-size:11px;margin-top:6px;">Doctor nearby</div>'

        const confirmedLine = p.confirmed > 0
          ? `<div style="font-size:13px;font-weight:700;color:#8b5cf6;">${p.confirmed} confirmed</div>`
          : ''
        const pendingLine = p.pending > 0
          ? `<div style="font-size:12px;color:#a78bfa;">${p.pending} pending (unconfirmed)</div>`
          : ''

        new maplibregl.Popup({ offset: 12, maxWidth: '240px', closeButton: true, focusAfterOpen: false })
          .setLngLat(coords)
          .setHTML(`
            <div style="padding:12px;font-family:-apple-system,system-ui,sans-serif;">
              <div style="font-size:14px;font-weight:700;color:#1E2D3B;">${p.city}, ${p.state}</div>
              <div style="font-size:12px;color:#666;margin-bottom:6px;">ZIP ${p.zip}</div>
              ${confirmedLine}
              ${pendingLine}
              ${gapLabel}
            </div>
          `)
          .addTo(map)
      }

      map.on('click', layerId, handleDemandClick)
      map.on('click', gapLayerId, handleDemandClick)
      map.on('click', 'demand-pending', handleDemandClick)
      map.on('mouseenter', layerId, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', layerId, () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', gapLayerId, () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', gapLayerId, () => { map.getCanvas().style.cursor = '' })
      map.on('mouseenter', 'demand-pending', () => { map.getCanvas().style.cursor = 'pointer' })
      map.on('mouseleave', 'demand-pending', () => { map.getCanvas().style.cursor = '' })
    } else {
      // Remove demand layers
      if (map.getLayer(gapLayerId)) map.removeLayer(gapLayerId)
      if (map.getLayer('demand-pending')) map.removeLayer('demand-pending')
      if (map.getLayer(layerId)) map.removeLayer(layerId)
      if (map.getSource(sourceId)) map.removeSource(sourceId)
    }
  }, [showDemand, demand])

  // ── Lookup ──
  const handleLookup = async () => {
    if (!lookupQuery.trim()) return
    setLookupLoading(true)
    try {
      const result = await lookupNearby(lookupQuery.trim())
      setLookupResults(result.doctors)
      setLookupLabel(result.label)
    } catch {
      setLookupLabel('Lookup failed')
      setLookupResults([])
    }
    setLookupLoading(false)
  }

  const sortedLookupResults = lookupResults ? [...lookupResults].sort((a, b) => {
    if (lookupSort === 'distance') return a.distance_miles - b.distance_miles
    if (lookupSort === 'name') return `${a.last_name} ${a.first_name}`.localeCompare(`${b.last_name} ${b.first_name}`)
    // tier: verified first
    const tP: Record<string, number> = { verified: 0, pending: 1 }
    return (tP[a.verification_status] ?? 2) - (tP[b.verification_status] ?? 2)
  }) : null

  // Invisible doctors (for the list below the map)
  const invisibleDocs = doctors.filter(d => d.pin_status === 'invisible')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Stats bar */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold">Coverage Map</h1>
          <button onClick={() => setShowStatsPanel(!showStatsPanel)} className="text-white/50 text-xs flex items-center gap-1">
            {showStatsPanel ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showStatsPanel ? 'Hide' : 'Stats'}
          </button>
        </div>

        {showStatsPanel && (
          <div className="space-y-3">
            {/* Row 1: Doctor counts */}
            <div className="grid grid-cols-3 gap-2">
              <StatCard label="Verified" value={stats.verified} color="text-green-400" sub="Live on directory, searchable" />
              <StatCard label="Pending" value={stats.pending} color="text-amber-400" sub="Awaiting approval or onboarding" />
              <StatCard label="Invisible" value={stats.invisible} color="text-red-400" sub="No coordinates. Can't be found." />
            </div>

            {/* Row 2: Coverage + subscribers */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">States With a Doctor</p>
                <p className="text-xl font-bold">{stats.statesWithDoctor.length}<span className="text-white/30 text-sm"> / {ALL_US_STATES.length}</span></p>
                {stats.statesWithout.length > 0 && (
                  <p className="text-[10px] text-red-400/70 mt-1">No doctors yet: {stats.statesWithout.join(', ')}</p>
                )}
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Patient Waitlist</p>
                <p className="text-xl font-bold">{stats.confirmedSubscribers} <span className="text-white/30 text-sm">confirmed</span></p>
                {stats.pendingSubscribers > 0 && (
                  <p className="text-xs text-purple-400/70 mt-0.5">{stats.pendingSubscribers} pending (unconfirmed)</p>
                )}
                <p className="text-[10px] text-white/25 mt-1">People who signed up to find a doctor near them</p>
                {stats.internationalCount > 0 && (
                  <p className="text-[10px] text-white/30 mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {stats.internationalCount} international doctors (not on US map)
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Top gaps — the recruiting list */}
            {stats.topGaps.length > 0 && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                <p className="text-[10px] text-rose-400 uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Recruit Here First
                </p>
                <p className="text-[10px] text-white/40 mb-2">Waitlist subscribers with no doctor within 50 miles. These people signed up and we have nobody to show them.</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1">
                  {stats.topGaps.map((g, i) => (
                    <span key={i} className="text-xs text-white/80">
                      <span className="font-bold">{g.city}, {g.state}</span>
                      <span className="text-rose-400 ml-1">
                        {g.confirmed > 0 ? `${g.confirmed} confirmed` : ''}
                        {g.confirmed > 0 && g.pending > 0 ? ' + ' : ''}
                        {g.pending > 0 ? `${g.pending} pending` : ''}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map controls */}
      <div className="px-4 py-2 border-b border-white/10 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-[10px] font-bold">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: PIN_COLORS.verified }} /> Verified
          <span className="w-2.5 h-2.5 rounded-full ml-2" style={{ background: PIN_COLORS.pending }} /> Pending
        </div>
        <button
          onClick={() => setShowDemand(!showDemand)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-colors ${
            showDemand ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-white/5 text-white/50 border border-white/10'
          }`}
        >
          {showDemand ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
          Patient Demand
        </button>
        {showDemand && (
          <div className="flex items-center gap-2 text-[10px] font-bold flex-wrap">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: DEMAND_COLOR }} /> Confirmed
            <span className="w-2.5 h-2.5 rounded-full ml-1 opacity-40" style={{ background: DEMAND_COLOR }} /> Pending
            <span className="w-2.5 h-2.5 rounded-full ml-1 ring-2 ring-white" style={{ background: GAP_COLOR }} /> Gap
          </div>
        )}
      </div>

      {/* Map */}
      <div ref={mapRef} className="w-full" style={{ height: 'min(60vh, 500px)' }} />

      {/* Invisible doctors list */}
      {invisibleDocs.length > 0 && (
        <div className="px-4 py-3 border-t border-white/10">
          <p className="text-xs font-bold text-red-400 mb-2 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {invisibleDocs.length} doctors not on map (no valid location)
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {invisibleDocs.map(d => (
              <Link key={d.id} href={`/admin/directory?search=${encodeURIComponent([d.first_name, d.last_name].filter(Boolean).join(' '))}`}
                className="text-xs text-white/50 hover:text-white/80">
                {[d.first_name, d.last_name].filter(Boolean).join(' ') || d.clinic_name}
                <span className="text-white/20 ml-1">({d.city}, {d.state})</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Lookup box */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-xs font-bold text-white/60 uppercase tracking-wider mb-2">Doctor Lookup</p>
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
            <input
              type="text"
              placeholder="City, ZIP, or 'Tulsa, OK'..."
              value={lookupQuery}
              onChange={e => setLookupQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleLookup() }}
              className="w-full pl-9 pr-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-neuro-orange"
            />
          </div>
          <button
            onClick={handleLookup}
            disabled={lookupLoading || !lookupQuery.trim()}
            className="px-4 py-3 bg-neuro-orange text-white rounded-xl font-bold text-sm disabled:opacity-50"
          >
            {lookupLoading ? '...' : 'Search'}
          </button>
        </div>

        {lookupLabel && (
          <p className="text-xs text-white/50 mb-2">{lookupLabel}</p>
        )}

        {sortedLookupResults && (
          <>
            {sortedLookupResults.length > 0 ? (
              <>
                <div className="flex gap-2 mb-2">
                  {(['distance', 'name', 'tier'] as const).map(s => (
                    <button key={s} onClick={() => setLookupSort(s)}
                      className={`px-2 py-1 rounded text-[10px] font-bold ${lookupSort === s ? 'bg-neuro-orange text-white' : 'text-white/40'}`}>
                      {s === 'distance' ? 'Nearest' : s === 'name' ? 'A-Z' : 'Status'}
                    </button>
                  ))}
                </div>
                <div className="space-y-1 max-h-[50vh] overflow-y-auto">
                  {sortedLookupResults.map(d => (
                    <div key={d.id} className="flex items-center gap-3 py-2 px-3 bg-white/5 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          Dr. {d.first_name} {d.last_name}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">{d.clinic_name} - {d.city}, {d.state}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-neuro-orange">{d.distance_miles} mi</p>
                        <p className={`text-[10px] font-bold ${d.verification_status === 'verified' ? 'text-green-400' : 'text-amber-400'}`}>
                          {d.verification_status}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Link href={`/directory/${d.slug || d.id}`} target="_blank" className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10">
                          <ExternalLink className="w-3 h-3 text-white/50" />
                        </Link>
                        <Link href={`/admin/directory?search=${encodeURIComponent(`${d.first_name} ${d.last_name}`)}`} target="_blank" className="p-1.5 bg-white/5 rounded-lg hover:bg-white/10">
                          <MapPin className="w-3 h-3 text-white/50" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-xs text-white/30 py-4 text-center">No doctors within 100 miles</p>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Helpers ──

function StatCard({ label, value, color, sub }: { label: string; value: number; color: string; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <p className="text-[10px] text-white/40 uppercase font-bold tracking-wider">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-[10px] text-white/25 mt-0.5 leading-tight">{sub}</p>}
    </div>
  )
}

const ALL_US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','DC','FL','GA','HI','ID','IL','IN',
  'IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH',
  'NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT',
  'VT','VA','WA','WV','WI','WY'
]
