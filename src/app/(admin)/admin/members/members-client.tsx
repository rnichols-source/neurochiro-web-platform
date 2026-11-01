'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { EmptyState } from '@/components/admin/ui/EmptyState'
import { PageHeader } from '@/components/admin/ui/PageHeader'
import { SlideOver } from '@/components/admin/ui/SlideOver'
import { memberHref, type MemberDetail, type MemberListRow, type MemberQuery, type MemberSearchResult, type MemberStatusFilter, type MemberTierFilter } from '@/lib/admin/member-search'
import { MemberPanel } from './member-panel'

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
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date)
}

function place(row: MemberListRow) {
  return [row.city, row.state].filter(Boolean).join(', ') || '—'
}

export function MembersClient({
  query,
  result,
  loadError,
  detail,
  detailError,
}: {
  query: MemberQuery
  result: MemberSearchResult
  loadError: boolean
  detail: MemberDetail | null
  detailError: boolean
}) {
  const router = useRouter()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLInputElement | null>(null)
  const rowsRef = useRef(result.rows)
  const draft = useRef(query)
  const [active, setActive] = useState(0)
  const activeRef = useRef(active)

  useEffect(() => {
    rowsRef.current = result.rows
  }, [result.rows])

  useEffect(() => {
    activeRef.current = active
  }, [active])

  useEffect(() => {
    draft.current = { ...draft.current, member: query.member }
  }, [query.member])

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
      } else if (event.key === 'Enter' && rows.length > 0) {
        const row = rows[Math.min(activeRef.current, rows.length - 1)]
        if (!row) return
        event.preventDefault()
        const next = { ...draft.current, member: row.id }
        draft.current = next
        if (timer.current) clearTimeout(timer.current)
        router.replace(memberHref(next), { scroll: false })
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      if (timer.current) clearTimeout(timer.current)
    }
  }, [router])

  function visit(patch: Partial<MemberQuery>, delay = false) {
    const next = { ...draft.current, ...patch }
    draft.current = next
    const href = memberHref(next)
    if (timer.current) clearTimeout(timer.current)
    if (!delay) {
      router.replace(href, { scroll: false })
      return
    }
    timer.current = setTimeout(() => router.replace(memberHref(draft.current), { scroll: false }), 300)
  }

  const pages = Math.max(1, Math.ceil(result.total / query.pageSize))
  const highlighted = result.rows.length === 0 ? -1 : Math.min(active, result.rows.length - 1)

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6">
      <PageHeader title="Members" description="Find a doctor, student, or vendor. The link keeps the search, so back and forward still work." />
      <p className="text-sm text-neuro-gray"><span className="tabular-nums">{result.total}</span> matches</p>
      <div className="space-y-3">
        <input
          id="member-search"
          ref={searchRef}
          defaultValue={query.q}
          placeholder="Name, email, practice, or city"
          aria-label="Search members"
          onChange={(event) => visit({ q: event.target.value, page: 1 }, true)}
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
          <input
            defaultValue={query.state}
            aria-label="State"
            placeholder="State"
            onChange={(event) => visit({ state: event.target.value, page: 1 }, true)}
            className="min-h-11 w-28 rounded-xl border border-black/10 bg-white px-3 text-sm"
          />
          <input
            defaultValue={query.country}
            aria-label="Country"
            placeholder="Country"
            onChange={(event) => visit({ country: event.target.value, page: 1 }, true)}
            className="min-h-11 w-36 rounded-xl border border-black/10 bg-white px-3 text-sm"
          />
          <FilterButton active={query.sort === 'name'} onClick={() => visit({ sort: 'name', page: 1 })}>Name</FilterButton>
          <FilterButton active={query.sort === 'recent'} onClick={() => visit({ sort: 'recent', page: 1 })}>Recent</FilterButton>
        </div>
      </div>
      {loadError ? <EmptyState title="Members could not be loaded." body="Try the search again in a moment." /> : null}
      {!loadError && result.rows.length === 0 ? <EmptyState title="No members match." body="Try a different name, email, or filter." /> : null}
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
                      <Link href={memberHref({ ...query, member: row.id })} className="inline-flex min-h-11 items-center font-medium text-neuro-navy">
                        {row.name}
                      </Link>
                      <p className="text-xs text-neuro-gray">{row.role}{row.email ? ` · ${row.email}` : ''}</p>
                    </td>
                    <td className="px-4 py-2">{row.practice || '—'}</td>
                    <td className="px-4 py-2">{place(row)}</td>
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
                <Link href={memberHref({ ...query, member: row.id })} className={`block min-h-11 rounded-2xl bg-white px-4 py-3 ${index === highlighted ? 'ring-2 ring-neuro-orange' : ''}`}>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-neuro-gray">{row.practice || row.role}{row.email ? ` · ${row.email}` : ''}</p>
                  <p className="text-neuro-gray">{place(row)} · {row.billingLabel} · {row.verificationLabel}</p>
                  <p className="tabular-nums text-neuro-gray">{when(row.lastActivity)}</p>
                </Link>
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
      <SlideOver open={Boolean(query.member)} title={detail?.name || 'Member'} onClose={() => visit({ member: '' })}>
        <MemberPanel detail={detail} detailError={detailError} />
      </SlideOver>
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
