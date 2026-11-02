'use client'

import { startTransition, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminRefresh } from '@/components/admin/ui/AdminRefresh'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { SlideOver } from '@/components/admin/ui/SlideOver'
import { describeEmpty, isNearbyPlace, parseLocationQuery } from '@/lib/admin/location-query'
import { memberHref, type MemberDetail, type MemberListRow, type MemberQuery, type MemberSearchResult, type MemberStatusFilter, type MemberTierFilter } from '@/lib/admin/member-search'
import type { MemberLocationOptions } from './actions'
import { matchCountry } from '@/lib/geo/country-alias'
import { regionCountry } from '@/lib/geo/region-alias'
import { loadMemberDetail } from './actions'
import { MemberPanel, MemberPanelSkeleton } from './member-panel'

const ROLES = [
  { id: 'doctor', label: 'Doctor' },
  { id: 'student', label: 'Student' },
  { id: 'vendor', label: 'Vendor' },
] as const

const STATUSES: { id: MemberStatusFilter; label: string }[] = [
  { id: 'verified', label: 'Verified' },
  { id: 'pending', label: 'Pending' },
  { id: 'onboarding', label: 'Onboarding' },
  { id: 'hidden', label: 'Hidden' },
]

const TIERS: { id: MemberTierFilter; label: string }[] = [
  { id: 'paying', label: 'Paying' },
  { id: 'trialing', label: 'Trialing' },
  { id: 'past_due', label: 'Past due' },
  { id: 'founding', label: 'Founding/Comped' },
  { id: 'free', label: 'Free' },
]

function when(value: string | null) {
  if (!value) return 'Unknown'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/New_York' }).format(date)
}

function PlaceLine({ row, query }: { row: MemberListRow; query: MemberQuery }) {
  const parsed = parseLocationQuery(query.q, { country: query.country || undefined })
  const cityHit = Boolean(parsed.city && row.city && row.city.toLowerCase().includes(parsed.city.toLowerCase()))
  const stateHit = Boolean(parsed.states[0] && row.state && (row.state.toUpperCase() === parsed.states[0] || row.state.toLowerCase() === parsed.states[0].toLowerCase()))
  const zipHit = Boolean(parsed.postal && row.zipCode && row.zipCode.replace(/\s+/g, '').toUpperCase().includes(parsed.postal.code))
  const country = matchCountry(row.country || '')
  const flag = country?.flag || ''
  const miles = typeof row.distanceMiles === 'number' ? `${row.distanceMiles.toFixed(1)} mi` : ''
  const zip = row.zipCode || ''
  if (!row.city && !row.state && !zip && !flag && !miles) return <>—</>
  return (
    <>
      <span className={cityHit ? 'font-bold' : undefined}>{row.city}</span>
      {row.city && row.state ? ', ' : ''}
      <span className={stateHit ? 'font-bold' : undefined}>{row.state}</span>
      {zip ? <> · <span className={zipHit ? 'font-bold' : undefined}>{zip}</span></> : null}
      {flag ? ` · ${flag}` : ''}
      {miles ? ` · ${miles}` : ''}
    </>
  )
}

export function MembersClient({
  query,
  result,
  loadError,
  detail,
  detailError,
  updatedAt,
  locations,
}: {
  query: MemberQuery
  result: MemberSearchResult
  loadError: boolean
  detail: MemberDetail | null
  detailError: boolean
  updatedAt: string
  locations: MemberLocationOptions
}) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const rowsRef = useRef(result.rows)
  const draft = useRef(query)
  const detailRequest = useRef(0)
  const [active, setActive] = useState(0)
  const activeRef = useRef(active)
  const [searchDraft, setSearchDraft] = useState<string | null>(null)
  const [panelMember, setPanelMember] = useState(query.member)
  const [panelDetail, setPanelDetail] = useState<MemberDetail | null>(detail)
  const [panelError, setPanelError] = useState(detailError)
  const [panelPending, setPanelPending] = useState(false)
  const [trackedPanel, setTrackedPanel] = useState({ member: query.member, detail, error: detailError })
  if (searchDraft !== null && searchDraft === query.q) setSearchDraft(null)
  const searchText = searchDraft ?? query.q

  if (query.member !== trackedPanel.member || detail !== trackedPanel.detail || detailError !== trackedPanel.error) {
    setTrackedPanel({ member: query.member, detail, error: detailError })
    setPanelMember(query.member)
    setPanelDetail(detail)
    setPanelError(detailError)
    setPanelPending(false)
  }

  useEffect(() => {
    rowsRef.current = result.rows
  }, [result.rows])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    draft.current = { ...draft.current, ...query }
  }, [query])

  const openMember = useCallback((id: string) => {
    const next = { ...draft.current, member: id }
    draft.current = next
    window.history.replaceState(null, '', memberHref(next))
    setPanelMember(id)
    if (!id) {
      setPanelDetail(null)
      setPanelError(false)
      setPanelPending(false)
      return
    }
    const request = detailRequest.current + 1
    detailRequest.current = request
    setPanelPending(true)
    setPanelDetail(null)
    setPanelError(false)
    void loadMemberDetail(id)
      .then((loaded) => {
        if (detailRequest.current !== request) return
        setPanelDetail(loaded)
        setPanelError(false)
        setPanelPending(false)
      })
      .catch(() => {
        if (detailRequest.current !== request) return
        setPanelError(true)
        setPanelPending(false)
      })
  }, [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target
      const field = target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)
      if (event.key === '/' && !field) {
        event.preventDefault()
        searchRef.current?.focus()
        return
      }
      if (field && target instanceof HTMLElement && target.id !== 'member-search') return
      const rows = rowsRef.current
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActive((current) => Math.min(rows.length - 1, current + 1))
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActive((current) => Math.max(0, current - 1))
      } else if (event.key === 'Enter' && target instanceof HTMLElement && target.id === 'member-search') {
        const typed = (target as HTMLInputElement).value.trim()
        const parsed = parseLocationQuery(typed, { country: draft.current.country || undefined })
        if (isNearbyPlace(parsed)) {
          event.preventDefault()
          if (timer.current) clearTimeout(timer.current)
          const next = { ...draft.current, q: typed, near: draft.current.near || 100, page: 1 }
          draft.current = next
          startTransition(() => router.replace(memberHref(next), { scroll: false }))
          return
        }
        const row = rows[Math.min(activeRef.current, rows.length - 1)]
        if (!row) return
        event.preventDefault()
        openMember(row.id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [openMember, router])

  function visit(patch: Partial<MemberQuery>, delay = false) {
    const next = { ...draft.current, ...patch }
    draft.current = next
    const go = () => {
      startTransition(() => {
        router.replace(memberHref(draft.current), { scroll: false })
      })
    }
    if (timer.current) clearTimeout(timer.current)
    if (!delay) {
      go()
      return
    }
    timer.current = setTimeout(go, 300)
  }

  const pages = Math.max(1, Math.ceil(result.total / query.pageSize))
  const highlighted = result.rows.length === 0 ? -1 : Math.min(active, result.rows.length - 1)

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <PageHeader title="Members" description="Find a doctor, student, or vendor. The link keeps the search, so back and forward still work." action={<AdminRefresh at={updatedAt} />} />
      <p className="text-sm text-neuro-gray"><span className="tabular-nums">{result.total}</span> matches</p>
      {result.billingOk === false ? (
        <p className="rounded-xl bg-white px-4 py-3 text-sm text-neuro-navy">Stripe is unavailable right now, so billing labels may be wrong.</p>
      ) : null}
      {result.note ? <p className="text-sm text-neuro-gray">{result.note}</p> : null}
      {result.banner ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm text-neuro-navy">
          <span>{result.banner.title}</span>
          {result.banner.tone === 'near' ? [25, 50, 100, 250].map((miles) => (
            <FilterButton key={miles} active={query.near === miles} onClick={() => visit({ near: miles, page: 1 })}>
              {`${miles} mi`}
            </FilterButton>
          )) : null}
        </div>
      ) : null}
      <SuggestionChips query={query} onVisit={visit} />
      <div className="space-y-3">
        <input
          id="member-search"
          ref={searchRef}
          value={searchText}
          placeholder="Name, email, city, state, ZIP, or country"
          aria-label="Search members"
          onChange={(event) => {
            const value = event.target.value
            setSearchDraft(value)
            visit({ q: value, near: null, page: 1 }, true)
          }}
          className="min-h-11 w-full rounded-xl border border-black/10 bg-white px-3 text-sm text-neuro-navy"
        />
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center text-sm text-neuro-gray">Role</span>
          {ROLES.map((role) => (
            <FilterButton key={role.id} active={query.role === role.id} onClick={() => visit({ role: query.role === role.id ? '' : role.id, page: 1 })}>
              {role.label}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center text-sm text-neuro-gray">Status</span>
          {STATUSES.map((status) => (
            <FilterButton key={status.id} active={query.status === status.id} onClick={() => visit({ status: query.status === status.id ? '' : status.id, page: 1 })}>
              {status.label}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-11 items-center text-sm text-neuro-gray">Billing</span>
          {TIERS.map((tier) => (
            <FilterButton key={tier.id} active={query.tier === tier.id} onClick={() => visit({ tier: query.tier === tier.id ? '' : tier.id, page: 1 })}>
              {tier.label}
            </FilterButton>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="min-h-11">
            <span className="sr-only">State</span>
            <select
              aria-label="State"
              value={query.state}
              onChange={(event) => visit({ state: event.target.value, page: 1 })}
              className="min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm"
            >
              <option value="">All states</option>
              {stateChoices(locations, query).map((state) => (
                <option key={`${state.country}|${state.code}`} value={state.code}>{state.label}</option>
              ))}
            </select>
          </label>
          <label className="min-h-11">
            <span className="sr-only">Country</span>
            <select
              aria-label="Country"
              value={query.country}
              onChange={(event) => visit({ country: event.target.value, state: '', page: 1 })}
              className="min-h-11 rounded-xl border border-black/10 bg-white px-3 text-sm"
            >
              <option value="">All countries</option>
              {locations.countries.map((country) => (
                <option key={country.code} value={country.code}>{`${country.flag ? `${country.flag} ` : ''}${country.label} (${country.count})`}</option>
              ))}
            </select>
          </label>
          <FilterButton active={query.sort === 'name'} onClick={() => visit({ sort: 'name', page: 1 })}>Name</FilterButton>
          <FilterButton active={query.sort === 'recent'} onClick={() => visit({ sort: 'recent', page: 1 })}>Recent</FilterButton>
          <FilterButton active={query.sort === 'newest'} onClick={() => visit({ sort: 'newest', page: 1 })}>Newest</FilterButton>
        </div>
      </div>
      {loadError ? <EmptyState title="Members could not be loaded." body="Try the search again in a moment." /> : null}
      {!loadError && result.banner?.hideStudents ? <p className="text-sm text-neuro-gray">Students and vendors have no location, so they are hidden.</p> : null}
      {!loadError && result.rows.length === 0 ? <EmptyState title={result.banner?.emptyTitle || describeEmpty(parseLocationQuery(query.q, { country: query.country || undefined })) || 'No members match.'} body="Try a different name, email, or filter." /> : null}
      {result.rows.length > 0 ? (
        <>
          <div className="hidden overflow-hidden rounded-2xl bg-white md:block">
            <table className="w-full text-left text-sm">
              <thead className="text-neuro-gray">
                <tr>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Practice</th>
                  <th className="px-4 py-3 font-medium">City</th>
                  <th className="px-4 py-3 font-medium">Billing</th>
                  <th className="px-4 py-3 font-medium">Verification</th>
                  <th className="px-4 py-3 font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, index) => (
                  <tr key={row.id} className={index === highlighted ? 'bg-neuro-cream' : undefined}>
                    <td className="px-4 py-2">
                      <button type="button" onClick={() => openMember(row.id)} className="inline-flex min-h-11 items-center gap-2 font-medium text-neuro-navy">
                        {row.name}
                        {row.isTest ? <span className="rounded-full bg-neuro-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-neuro-navy">Test</span> : null}
                      </button>
                      <p className="text-xs text-neuro-gray">{row.role}{row.email ? ` · ${row.email}` : ''}</p>
                    </td>
                    <td className="px-4 py-2">{row.practice || '—'}</td>
                    <td className="px-4 py-2"><PlaceLine row={row} query={query} /></td>
                    <td className="px-4 py-2">{row.billingLabel}</td>
                    <td className="px-4 py-2">{row.verificationLabel}</td>
                    <td className="px-4 py-2 tabular-nums">{when(row.lastActivity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-2 md:hidden">
            {result.rows.map((row, index) => (
              <li key={row.id}>
                <button type="button" onClick={() => openMember(row.id)} className={`block min-h-11 w-full rounded-2xl bg-white px-4 py-3 text-left ${index === highlighted ? 'ring-2 ring-neuro-orange' : ''}`}>
                  <p className="font-medium">{row.name}{row.isTest ? <span className="ml-2 rounded-full bg-neuro-cream px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">Test</span> : null}</p>
                  <p className="text-neuro-gray">{row.practice || row.role}{row.email ? ` · ${row.email}` : ''}</p>
                  <p className="text-neuro-gray"><PlaceLine row={row} query={query} /> · {row.billingLabel} · {row.verificationLabel}</p>
                  <p className="tabular-nums text-neuro-gray">{when(row.lastActivity)}</p>
                </button>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3">
            <button type="button" disabled={query.page <= 1} onClick={() => visit({ page: query.page - 1 })} className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3 disabled:opacity-50">
              Previous
            </button>
            <p className="tabular-nums text-sm text-neuro-gray">Page {query.page} of {pages}</p>
            <button type="button" disabled={query.page >= pages} onClick={() => visit({ page: query.page + 1 })} className="inline-flex min-h-11 items-center rounded-xl border border-black/10 bg-white px-3 disabled:opacity-50">
              Next
            </button>
          </div>
        </>
      ) : null}
      <SlideOver open={Boolean(panelMember)} title={panelDetail?.name || 'Member'} onClose={() => openMember('')}>
        {panelPending ? <MemberPanelSkeleton /> : <MemberPanel detail={panelDetail} detailError={panelError} />}
      </SlideOver>
    </div>
  )
}

function stateChoices(locations: MemberLocationOptions, query: MemberQuery) {
  const rows = query.country ? locations.states.filter((state) => state.country === query.country) : locations.states
  if (query.state && !rows.some((state) => state.code === query.state)) {
    return [{ code: query.state, label: query.state, country: query.country, count: 0 }, ...rows]
  }
  return rows
}

function SuggestionChips({ query, onVisit }: { query: MemberQuery; onVisit: (patch: Partial<MemberQuery>) => void }) {
  const parsed = parseLocationQuery(query.q, { country: query.country || undefined })
  const options = parsed.ambiguous.flatMap((group) => group.options)
  if (!options.length) return null
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const country = option.kind === 'country' ? matchCountry(option.code) : null
        const label = option.kind === 'country'
          ? `${country?.flag ? `${country.flag} ` : ''}${option.label} (country)`
          : `${option.label} (state)`
        return (
          <button
            key={`${option.kind}-${option.code}`}
            type="button"
            className="inline-flex min-h-11 items-center rounded-full border border-black/10 bg-white px-3 text-sm text-neuro-navy"
            onClick={() => {
              if (option.kind === 'country' && parsed.postal) {
                onVisit({ country: option.code, near: 100, page: 1 })
                return
              }
              if (option.kind === 'country') onVisit({ q: '', country: option.code, state: '', near: null, page: 1 })
              else onVisit({ q: parsed.city || '', state: option.code, country: regionCountry(option.code) || query.country || 'US', near: null, page: 1 })
            }}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

function FilterButton({ active, children, onClick }: { active: boolean; children: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex min-h-11 items-center rounded-full border px-3 text-sm ${active ? 'border-neuro-orange bg-neuro-orange text-white' : 'border-black/10 bg-white text-neuro-navy'}`}
    >
      {children}
    </button>
  )
}
