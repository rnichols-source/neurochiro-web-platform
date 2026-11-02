'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AdminRefresh } from '@/components/admin/ui/AdminRefresh'
import { getCountryByIso2 } from '@/config/countries'
import type { CoverageMapData, MapDoctor, MissingCountryDoctor } from '@/lib/admin/coverage-types'
import type { LocationOption } from '@/lib/admin/location-query'
import type { InvisibleDoctor } from '../invisible-doctors/actions'
import InvisibleDoctorsClient from '../invisible-doctors/InvisibleDoctorsClient'
import CoverageFilters, { filtersToQuery, readFilters, type FilterState } from './CoverageFilters'
import type { CoverageFrame, CoveragePin } from './CoverageMap'
import GapPanel from './GapPanel'
import type { AdminPlace } from './place-actions'

const CoverageMap = dynamic(() => import('./CoverageMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#E7E2D8]" />,
})

function sameCountry(value: string, country: string): boolean {
  return (value || 'US') === country
}

function doctorMatches(doctor: MapDoctor, filters: FilterState): boolean {
  if (!doctor.country || doctor.country !== filters.country) return false
  if (filters.state && doctor.state !== filters.state) return false
  if (filters.status && doctor.billing !== filters.status) return false
  if (filters.specialty && !doctor.specialties.includes(filters.specialty)) return false
  return true
}

function placeMatches(row: { country: string; state: string }, filters: FilterState): boolean {
  if (!sameCountry(row.country, filters.country)) return false
  if (filters.state && row.state !== filters.state) return false
  return true
}

function tabHref(tab: 'map' | 'pins', params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString())
  if (tab === 'map') next.delete('tab')
  else next.set('tab', 'pins')
  const query = next.toString()
  return query ? `/admin/coverage?${query}` : '/admin/coverage'
}

const RADII = [25, 50, 100, 250] as const

function appliedFilters(filters: FilterState, place: AdminPlace | null, skipState: boolean): FilterState {
  if (!place) return filters
  if (place.kind === 'country') return { ...filters, country: place.iso2, state: '' }
  if (place.kind === 'state') return { ...filters, country: place.country, state: place.state }
  if (place.kind === 'place') {
    return {
      ...filters,
      country: place.country || filters.country,
      state: skipState ? '' : (place.state || filters.state),
    }
  }
  return filters
}

function frameFor(place: AdminPlace | null): CoverageFrame | null {
  if (!place) return null
  if (place.kind === 'place') return { mode: 'fly', lng: place.lng, lat: place.lat, zoom: 10 }
  if (place.kind === 'country' && place.view) {
    return { mode: 'ease', lng: place.view.center[0], lat: place.view.center[1], zoom: place.view.zoom }
  }
  const box = place.kind === 'country' || place.kind === 'state' ? place.bbox : null
  if (!box) return null
  return { mode: 'bounds', west: box.west, south: box.south, east: box.east, north: box.north }
}

function pinFor(place: AdminPlace | null): CoveragePin | null {
  if (place?.kind !== 'place') return null
  return { lng: place.lng, lat: place.lat, label: place.label }
}

export default function CoverageExperience({
  tab,
  data,
  invisible,
  missingCountry,
  updatedAt,
  placeResult,
}: {
  tab: 'map' | 'pins'
  data: CoverageMapData | null
  invisible: InvisibleDoctor[]
  missingCountry: MissingCountryDoctor[]
  updatedAt: string
  placeResult: AdminPlace | null
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filters = readFilters(params)
  const placeParam = params.get('place') || ''
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number; token: number } | null>(null)
  const active = appliedFilters(filters, placeResult, params.get('nostate') === '1')
  const frame = useMemo(() => frameFor(placeResult), [placeResult])
  const pin = useMemo(() => pinFor(placeResult), [placeResult])

  const view = useMemo(() => {
    const known = getCountryByIso2(active.country)
    if (known?.mapView) return known.mapView
    return { center: [-96, 38] as [number, number], zoom: 3.8 }
  }, [active.country])

  const filtered = useMemo(() => {
    if (!data) {
      return { doctors: [], demand: [], mentions: [], gaps: [], countries: ['US'], states: [], specialties: [] }
    }
    const doctors = data.doctors.filter((doctor) => doctorMatches(doctor, active))
    const demand = data.demand.filter((point) => placeMatches(point, active))
    const mentions = data.mentions.filter((point) => placeMatches(point, active))
    const gaps = data.gaps
      .filter((gap) => placeMatches(gap, active))
      .sort((a, b) => {
        if (b.demandCount !== a.demandCount) return b.demandCount - a.demandCount
        const left = a.nearestMiles ?? Number.POSITIVE_INFINITY
        const right = b.nearestMiles ?? Number.POSITIVE_INFINITY
        return right - left
      })
      .slice(0, 50)
    const countries = [...new Set([
      'US',
      active.country,
      ...data.doctors.map((doctor) => doctor.country).filter(Boolean),
      ...data.demand.map((point) => point.country || 'US'),
      ...data.mentions.map((point) => point.country || 'US'),
    ])].filter(Boolean).sort((a, b) => (a === 'US' ? -1 : b === 'US' ? 1 : a.localeCompare(b)))
    const states = [...new Set(data.doctors
      .filter((doctor) => doctor.country === active.country && doctor.state)
      .map((doctor) => doctor.state))].sort()
    const specialties = [...new Set(data.doctors
      .filter((doctor) => doctor.country === active.country)
      .flatMap((doctor) => doctor.specialties))].sort()
    return { doctors, demand, mentions, gaps, countries, states, specialties }
  }, [data, active])

  function replaceQuery(next: URLSearchParams) {
    const query = next.toString()
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    setFiltersOpen(false)
  }

  function commit(next: FilterState) {
    const query = new URLSearchParams(filtersToQuery(next, new URLSearchParams(params.toString())))
    query.delete('place')
    query.delete('choice')
    query.delete('code')
    query.delete('near')
    query.delete('nostate')
    replaceQuery(query)
  }

  function submitPlace(raw: string) {
    const next = new URLSearchParams(params.toString())
    const q = raw.trim()
    next.delete('choice')
    next.delete('code')
    next.delete('nostate')
    next.delete('near')
    if (q) next.set('place', q)
    else next.delete('place')
    replaceQuery(next)
  }

  function pickOption(option: LocationOption) {
    const next = new URLSearchParams(params.toString())
    const compact = (params.get('place') || '').replace(/\s+/g, '')
    if (option.kind === 'country' && /^\d{4}$/.test(compact)) {
      next.set('country', option.code)
      next.delete('state')
      next.delete('choice')
      next.delete('code')
      next.delete('nostate')
      replaceQuery(next)
      return
    }
    next.set('choice', option.kind)
    next.set('code', option.code)
    if (option.kind === 'country') {
      next.set('country', option.code)
      next.delete('state')
    } else {
      next.set('state', option.code)
      next.delete('nostate')
    }
    replaceQuery(next)
  }

  function clearCountry() {
    const next = new URLSearchParams(params.toString())
    next.delete('country')
    next.delete('state')
    next.delete('place')
    next.delete('choice')
    next.delete('code')
    next.delete('near')
    next.delete('nostate')
    replaceQuery(next)
  }

  function clearState() {
    const next = new URLSearchParams(params.toString())
    next.delete('state')
    if (params.get('place')) next.set('nostate', '1')
    replaceQuery(next)
  }

  function setRadius(miles: number) {
    const next = new URLSearchParams(params.toString())
    next.set('near', String(miles))
    replaceQuery(next)
  }

  const countryKnown = getCountryByIso2(active.country)
  const countryChip = countryKnown ? `${countryKnown.flag} ${countryKnown.name}` : active.country

  const queryParams = new URLSearchParams(params.toString())

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-neuro-cream text-neuro-navy">
      <header className="flex shrink-0 items-center justify-between gap-2 border-b border-black/10 px-3 py-2">
        <h1 className="font-heading text-lg font-bold">Coverage</h1>
        <div className="flex items-center gap-2">
          <AdminRefresh at={updatedAt} />
          <Link href={tabHref('map', queryParams)} className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold ${tab === 'map' ? 'bg-neuro-orange text-white' : 'bg-white text-neuro-navy'}`}>
            Map
          </Link>
          <Link href={tabHref('pins', queryParams)} className={`inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold ${tab === 'pins' ? 'bg-neuro-orange text-white' : 'bg-white text-neuro-navy'}`}>
            Fix pins
          </Link>
          {tab === 'map' ? (
            <button type="button" className="inline-flex min-h-11 items-center rounded-xl bg-white px-3 text-sm font-bold md:hidden" onClick={() => setFiltersOpen(true)}>
              Filters
            </button>
          ) : null}
        </div>
      </header>

      {tab === 'pins' ? (
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <div className="rounded-2xl bg-neuro-navy p-4 text-white">
            <InvisibleDoctorsClient doctors={invisible} />
          </div>
          <section className="mt-6">
            <h2 className="font-heading text-lg font-bold">Missing country</h2>
            <p className="mt-1 text-sm text-neuro-navy/70">These doctors have no country on file. They are not geocoded from this tab.</p>
            {missingCountry.length === 0 ? (
              <p className="mt-3 text-sm">Every verified or pending doctor has a country.</p>
            ) : (
              <ul className="mt-3 divide-y divide-black/10">
                {missingCountry.map((doctor) => (
                  <li key={doctor.id} className="flex min-h-11 flex-wrap items-center justify-between gap-2 py-2">
                    <span className="text-sm">
                      {doctor.name}
                      {doctor.practice ? ` · ${doctor.practice}` : ''}
                      {' · Country missing'}
                      {doctor.address ? ` · ${doctor.address}` : ''}
                      {doctor.city || doctor.state ? ` · ${[doctor.city, doctor.state].filter(Boolean).join(', ')}` : ''}
                    </span>
                    <Link className="inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink" href={`/admin/members?member=${encodeURIComponent(doctor.id)}`}>
                      Open member
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <>
          <div className="shrink-0 border-b border-black/10 px-3 py-3">
            <PlaceSearchForm key={placeParam} placeParam={placeParam} onSubmit={submitPlace} />
            <div className="mt-2 flex flex-wrap gap-2">
              <button type="button" className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm font-bold" onClick={clearCountry}>
                {countryChip} ×
                <span className="sr-only">Remove {countryChip}</span>
              </button>
              {active.state ? (
                <button type="button" className="inline-flex min-h-11 items-center rounded-full bg-white px-3 text-sm font-bold" onClick={clearState}>
                  {active.state} ×
                  <span className="sr-only">Remove {active.state}</span>
                </button>
              ) : null}
              {placeResult?.kind === 'ambiguous' ? placeResult.options.map((option) => (
                <button
                  key={`${option.kind}-${option.code}`}
                  type="button"
                  className="inline-flex min-h-11 items-center rounded-full border border-neuro-orange bg-white px-3 text-sm font-bold text-neuro-orange-ink"
                  onClick={() => pickOption(option)}
                >
                  {option.label} ({option.kind})
                </button>
              )) : null}
            </div>
            {placeResult?.kind === 'none' && placeResult.message ? (
              <p className="mt-2 text-sm text-neuro-navy">{placeResult.message}</p>
            ) : null}
            <div className="mt-3 hidden md:block">
              <CoverageFilters
                value={active}
                countries={filtered.countries}
                states={filtered.states}
                specialties={filtered.specialties}
                counts={{
                  doctors: filtered.doctors.length,
                  demand: filtered.demand.reduce((sum, point) => sum + point.count, 0),
                  mentions: filtered.mentions.reduce((sum, point) => sum + point.count, 0),
                  gaps: filtered.gaps.length,
                }}
                stripeOk={data?.stripeOk !== false}
                onChange={commit}
              />
            </div>
          </div>
          <div className="relative min-h-0 flex-1">
            <CoverageMap
              doctors={filtered.doctors}
              demand={filtered.demand}
              mentions={filtered.mentions}
              gaps={filtered.gaps}
              showDoctors={active.layers.doctors}
              showDemand={active.layers.demand}
              showMentions={active.layers.mentions}
              showGaps={active.layers.gaps}
              viewKey={`${view.center[0]},${view.center[1]},${view.zoom}`}
              center={view.center}
              zoom={view.zoom}
              flyTo={flyTo}
              frame={frame}
              pin={pin}
            />
            <CoverageLegend />
            {data && data.stripeOk === false ? (
              <p className="absolute left-2 right-2 top-16 z-10 rounded-xl bg-white px-3 py-2 text-sm text-neuro-navy shadow md:top-14">
                Stripe is unavailable right now, so billing labels may be wrong.
              </p>
            ) : null}
            {placeResult?.kind === 'place' ? (
              <aside className="absolute inset-x-2 bottom-16 z-20 max-h-[40vh] overflow-y-auto rounded-2xl bg-white p-3 text-neuro-navy shadow md:inset-x-auto md:bottom-3 md:right-2 md:top-3 md:max-h-none md:w-72">
                <h2 className="font-heading text-sm font-bold">Doctors near {placeResult.label}</h2>
                <p className="mt-1 text-xs text-neuro-navy/70">{placeResult.doctors.length} within {placeResult.radius} mi</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {RADII.map((miles) => (
                    <button
                      key={miles}
                      type="button"
                      className={`inline-flex min-h-11 items-center rounded-full px-3 text-xs font-bold ${placeResult.radius === miles ? 'bg-neuro-navy text-white' : 'bg-neuro-cream text-neuro-navy'}`}
                      onClick={() => setRadius(miles)}
                    >
                      {miles} mi
                    </button>
                  ))}
                </div>
                <ul className="mt-2 divide-y divide-black/10">
                  {placeResult.doctors.length === 0 ? <li className="py-2 text-sm">No doctors within {placeResult.radius} mi.</li> : null}
                  {placeResult.doctors.map((doctor) => (
                    <li key={doctor.id}>
                      <Link className="flex min-h-11 flex-col justify-center py-1" href={`/admin/members?member=${encodeURIComponent(doctor.id)}`}>
                        <span className="text-sm font-bold">{doctor.name}</span>
                        <span className="text-xs text-neuro-navy/70">
                          {[doctor.city, doctor.state].filter(Boolean).join(', ')}
                          {doctor.miles != null ? ` · ${doctor.miles} mi` : ''}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            ) : null}
            {active.layers.gaps ? (
              <GapPanel
                gaps={filtered.gaps}
                onSelect={(gap) => setFlyTo({ lng: gap.lng, lat: gap.lat, token: Date.now() })}
              />
            ) : null}
          </div>
          {filtersOpen ? (
            <div className="fixed inset-0 z-50 md:hidden">
              <button type="button" className="absolute inset-0 bg-neuro-navy/40" aria-label="Close filters" onClick={() => setFiltersOpen(false)} />
              <div className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl bg-neuro-cream p-4 pb-24">
                <CoverageFilters
                  value={active}
                  countries={filtered.countries}
                  states={filtered.states}
                  specialties={filtered.specialties}
                  counts={{
                    doctors: filtered.doctors.length,
                    demand: filtered.demand.reduce((sum, point) => sum + point.count, 0),
                    mentions: filtered.mentions.reduce((sum, point) => sum + point.count, 0),
                    gaps: filtered.gaps.length,
                  }}
                  stripeOk={data?.stripeOk !== false}
                  onChange={commit}
                />
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

function PlaceSearchForm({ placeParam, onSubmit }: { placeParam: string; onSubmit: (q: string) => void }) {
  const [draft, setDraft] = useState(placeParam)
  return (
    <form
      className="flex flex-wrap items-center gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(draft)
      }}
    >
      <label className="min-w-[16rem] flex-1 text-xs font-bold text-neuro-navy">
        Place
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="ZIP, postal code, city, state, or country"
          className="mt-1 min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm font-normal"
          aria-label="ZIP, postal code, city, state, or country"
        />
      </label>
      <button type="submit" className="inline-flex min-h-11 items-center rounded-xl bg-neuro-orange px-4 text-sm font-bold text-white">
        Go
      </button>
      <Link href="/admin/coverage/reply" className="inline-flex min-h-11 items-center text-sm font-bold text-neuro-orange-ink">
        Reply station (copy replies) →
      </Link>
    </form>
  )
}

const LEGEND = [
  { label: 'Paying', className: 'bg-[#D66829]' },
  { label: 'Trialing', className: 'border-2 border-[#D66829] bg-[#F5F3EF]' },
  { label: 'Past due', className: 'border-2 border-[#1E2D3B] bg-[#D97706]' },
  { label: 'Founding/comped', className: 'bg-[#1E2D3B]' },
  { label: 'Free', className: 'border-2 border-[#1E2D3B] bg-white' },
  { label: 'Pending', className: 'bg-[#9CA3AF]' },
  { label: 'Mismatch', className: 'border-2 border-[#E11D48] bg-white' },
]

function CoverageLegend() {
  const [open, setOpen] = useState(false)
  return (
    <div className="absolute bottom-16 left-2 z-10 w-40 rounded-xl bg-white/95 text-xs text-neuro-navy shadow md:bottom-3">
      <button type="button" className="flex min-h-11 w-full items-center justify-between px-3 md:hidden" aria-expanded={open} onClick={() => setOpen((current) => !current)}>
        Legend
      </button>
      <ul className={`${open ? 'block' : 'hidden'} space-y-1 px-3 pb-2 md:block md:pt-2`}>
        {LEGEND.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span className={`h-3 w-3 rounded-full ${item.className}`} />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  )
}
