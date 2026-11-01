'use client'

import type { StatusFilter } from '@/lib/admin/coverage-types'

export type LayerFlags = {
  doctors: boolean
  demand: boolean
  mentions: boolean
  gaps: boolean
}

export type FilterState = {
  country: string
  state: string
  status: StatusFilter
  specialty: string
  layers: LayerFlags
}

const STATUSES: { value: StatusFilter; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'paying', label: 'Paying' },
  { value: 'founding-comped', label: 'Founding/Comped' },
  { value: 'free', label: 'Free' },
  { value: 'pending', label: 'Pending' },
]

const LAYER_ORDER: { key: keyof LayerFlags; label: string; color: string }[] = [
  { key: 'doctors', label: 'Doctors', color: '#D66829' },
  { key: 'demand', label: 'Demand', color: '#5C4D9A' },
  { key: 'mentions', label: 'Mentions', color: '#0E7490' },
  { key: 'gaps', label: 'Gaps', color: '#E11D48' },
]

export function defaultLayers(): LayerFlags {
  return { doctors: true, demand: true, mentions: false, gaps: false }
}

export function readFilters(params: { get: (key: string) => string | null }): FilterState {
  const country = (params.get('country') || 'US').trim().toUpperCase() || 'US'
  const state = (params.get('state') || '').trim().toUpperCase()
  const statusRaw = params.get('status') || ''
  const status = STATUSES.some((item) => item.value === statusRaw && item.value !== '')
    ? (statusRaw as StatusFilter)
    : ''
  const specialty = params.get('specialty') || ''
  return { country, state, status, specialty, layers: readLayers(params.get('layers')) }
}

function readLayers(value: string | null): LayerFlags {
  if (value == null) return defaultLayers()
  if (value === 'none') return { doctors: false, demand: false, mentions: false, gaps: false }
  const picked = new Set(value.split(',').map((item) => item.trim()))
  return {
    doctors: picked.has('doctors'),
    demand: picked.has('demand'),
    mentions: picked.has('mentions'),
    gaps: picked.has('gaps'),
  }
}

export function filtersToQuery(filters: FilterState, base: URLSearchParams): string {
  const params = new URLSearchParams(base.toString())
  if (filters.country && filters.country !== 'US') params.set('country', filters.country)
  else params.delete('country')
  if (filters.state) params.set('state', filters.state)
  else params.delete('state')
  if (filters.status) params.set('status', filters.status)
  else params.delete('status')
  if (filters.specialty) params.set('specialty', filters.specialty)
  else params.delete('specialty')
  const layers = serializeLayers(filters.layers)
  if (layers) params.set('layers', layers)
  else params.delete('layers')
  return params.toString()
}

function serializeLayers(layers: LayerFlags): string {
  const picked = LAYER_ORDER.filter((item) => layers[item.key]).map((item) => item.key)
  if (picked.length === 2 && picked[0] === 'doctors' && picked[1] === 'demand') return ''
  if (picked.length === 0) return 'none'
  return picked.join(',')
}

export default function CoverageFilters({
  value,
  countries,
  states,
  specialties,
  counts,
  stripeOk,
  onChange,
}: {
  value: FilterState
  countries: string[]
  states: string[]
  specialties: string[]
  counts: { doctors: number; demand: number; mentions: number; gaps: number }
  stripeOk: boolean
  onChange: (next: FilterState) => void
}) {
  const stateOptions = value.state && !states.includes(value.state) ? [value.state, ...states] : states
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <label className="min-w-[8rem] flex-1 text-xs font-bold text-neuro-navy">
          Country
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-black/10 bg-white px-2 text-sm"
            value={value.country}
            onChange={(event) => onChange({ ...value, country: event.target.value, state: '' })}
          >
            {countries.map((country) => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[8rem] flex-1 text-xs font-bold text-neuro-navy">
          State
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-black/10 bg-white px-2 text-sm"
            value={value.state}
            onChange={(event) => onChange({ ...value, state: event.target.value })}
          >
            <option value="">All</option>
            {stateOptions.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[8rem] flex-1 text-xs font-bold text-neuro-navy">
          Status
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-black/10 bg-white px-2 text-sm"
            value={value.status}
            onChange={(event) => onChange({ ...value, status: event.target.value as StatusFilter })}
          >
            {STATUSES.map((status) => (
              <option key={status.label} value={status.value}>{status.label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-[8rem] flex-1 text-xs font-bold text-neuro-navy">
          Specialty
          <select
            className="mt-1 min-h-11 w-full rounded-xl border border-black/10 bg-white px-2 text-sm"
            value={value.specialty}
            onChange={(event) => onChange({ ...value, specialty: event.target.value })}
          >
            <option value="">All</option>
            {specialties.map((specialty) => (
              <option key={specialty} value={specialty}>{specialty}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {LAYER_ORDER.map((layer) => {
          const on = value.layers[layer.key]
          return (
            <button
              key={layer.key}
              type="button"
              className={`inline-flex min-h-11 items-center gap-2 rounded-xl border px-3 text-sm font-bold ${on ? 'border-neuro-navy bg-white text-neuro-navy' : 'border-black/10 text-neuro-navy/40'}`}
              onClick={() => onChange({ ...value, layers: { ...value.layers, [layer.key]: !on } })}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: layer.color, opacity: on ? 1 : 0.35 }} />
              {layer.label}
            </button>
          )
        })}
      </div>
      <p className="text-xs text-neuro-navy/70">
        {counts.doctors} doctors · {counts.demand} demand · {counts.mentions} mentions · {counts.gaps} gaps
        {stripeOk ? '' : ' · Billing status unavailable. Pins are still on the map.'}
      </p>
    </div>
  )
}
