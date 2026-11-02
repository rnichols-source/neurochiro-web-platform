'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { AdminRefresh } from '@/components/admin/ui/AdminRefresh'
import { getCountryByIso2 } from '@/config/countries'
import type { CoverageMapData, MapDoctor, MissingCountryDoctor } from '@/lib/admin/coverage-types'
import type { InvisibleDoctor } from '../invisible-doctors/actions'
import InvisibleDoctorsClient from '../invisible-doctors/InvisibleDoctorsClient'
import CoverageFilters, { filtersToQuery, readFilters, type FilterState } from './CoverageFilters'
import GapPanel from './GapPanel'

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

export default function CoverageExperience({
  tab,
  data,
  invisible,
  missingCountry,
  updatedAt,
}: {
  tab: 'map' | 'pins'
  data: CoverageMapData | null
  invisible: InvisibleDoctor[]
  missingCountry: MissingCountryDoctor[]
  updatedAt: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()
  const filters = readFilters(params)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [flyTo, setFlyTo] = useState<{ lng: number; lat: number; token: number } | null>(null)

  const view = useMemo(() => {
    const known = getCountryByIso2(filters.country)
    if (known?.mapView) return known.mapView
    return { center: [-96, 38] as [number, number], zoom: 3.8 }
  }, [filters.country])

  const filtered = useMemo(() => {
    if (!data) {
      return { doctors: [], demand: [], mentions: [], gaps: [], countries: ['US'], states: [], specialties: [] }
    }
    const doctors = data.doctors.filter((doctor) => doctorMatches(doctor, filters))
    const demand = data.demand.filter((point) => placeMatches(point, filters))
    const mentions = data.mentions.filter((point) => placeMatches(point, filters))
    const gaps = data.gaps
      .filter((gap) => placeMatches(gap, filters))
      .sort((a, b) => {
        if (b.demandCount !== a.demandCount) return b.demandCount - a.demandCount
        const left = a.nearestMiles ?? Number.POSITIVE_INFINITY
        const right = b.nearestMiles ?? Number.POSITIVE_INFINITY
        return right - left
      })
      .slice(0, 50)
    const countries = [...new Set([
      'US',
      ...data.doctors.map((doctor) => doctor.country).filter(Boolean),
      ...data.demand.map((point) => point.country || 'US'),
      ...data.mentions.map((point) => point.country || 'US'),
    ])].sort((a, b) => (a === 'US' ? -1 : b === 'US' ? 1 : a.localeCompare(b)))
    const states = [...new Set(data.doctors
      .filter((doctor) => doctor.country === filters.country && doctor.state)
      .map((doctor) => doctor.state))].sort()
    const specialties = [...new Set(data.doctors
      .filter((doctor) => doctor.country === filters.country)
      .flatMap((doctor) => doctor.specialties))].sort()
    return { doctors, demand, mentions, gaps, countries, states, specialties }
  }, [data, filters])

  function commit(next: FilterState) {
    const query = filtersToQuery(next, new URLSearchParams(params.toString()))
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    setFiltersOpen(false)
  }

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
          <div className="hidden shrink-0 border-b border-black/10 px-3 py-3 md:block">
            <CoverageFilters
              value={filters}
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
          <div className="relative min-h-0 flex-1">
            <CoverageMap
              doctors={filtered.doctors}
              demand={filtered.demand}
              mentions={filtered.mentions}
              gaps={filtered.gaps}
              showDoctors={filters.layers.doctors}
              showDemand={filters.layers.demand}
              showMentions={filters.layers.mentions}
              showGaps={filters.layers.gaps}
              viewKey={`${view.center[0]},${view.center[1]},${view.zoom}`}
              center={view.center}
              zoom={view.zoom}
              flyTo={flyTo}
            />
            <CoverageLegend />
            {data && data.stripeOk === false ? (
              <p className="absolute left-2 right-2 top-16 z-10 rounded-xl bg-white px-3 py-2 text-sm text-neuro-navy shadow md:top-14">
                Stripe is unavailable right now, so billing labels may be wrong.
              </p>
            ) : null}
            {filters.layers.gaps ? (
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
                  value={filters}
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
