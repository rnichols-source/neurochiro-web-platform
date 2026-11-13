'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { assignLibraryPlan } from '@/lib/community/library-actions'
import { EmptyNote } from '@/components/doctor/chrome'
import { SearchIcon } from '@/components/doctor/icons'

export type CarePreview = {
  slug: string
  name: string
  category: string
  categoryLabel: string
  objective: string
  exerciseCount: number
  phases: { name: string; exercises: string[] }[]
}

export function CareDesk({
  plans,
  categories,
  members,
  usage,
  initialMember,
}: {
  plans: CarePreview[]
  categories: { id: string; label: string }[]
  members: { id: string; label: string }[]
  usage: Record<string, number>
  initialMember?: string
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const [slug, setSlug] = useState(plans[0]?.slug || '')
  const [phase, setPhase] = useState(0)
  const [memberId, setMemberId] = useState(initialMember && members.some((member) => member.id === initialMember) ? initialMember : members[0]?.id || '')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [pending, start] = useTransition()
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    return plans.filter((plan) => {
      if (category !== 'all' && plan.category !== category) return false
      if (!q) return true
      return `${plan.name} ${plan.objective} ${plan.categoryLabel}`.toLowerCase().includes(q)
    })
  }, [plans, category, query])
  const selected = plans.find((plan) => plan.slug === slug) || shown[0] || null
  const phaseRow = selected?.phases[Math.min(phase, (selected?.phases.length || 1) - 1)]

  function assign() {
    if (!selected || !memberId) return
    setError('')
    setSaved('')
    start(async () => {
      const result = await assignLibraryPlan({ profileId: memberId, slug: selected.slug, note })
      if (!result.ok) {
        setError(result.error)
        return
      }
      setSaved('Assigned. It is on their Care page.')
      setNote('')
      router.refresh()
    })
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-12 min-w-[220px] flex-1 items-center gap-2 rounded-2xl border border-[#BFE3DD] bg-white px-3 text-[#0E857A]">
            <SearchIcon />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search plans" className="h-full w-full border-0 bg-transparent text-[15px] text-[#15202B] outline-none" />
          </label>
          <button type="button" onClick={() => setCategory('all')} className={`dp-ui min-h-11 rounded-full px-3 text-[13px] font-extrabold ${category === 'all' ? 'bg-[#0E857A] text-white' : 'border border-[#BFE3DD] bg-white text-[#0A6159]'}`}>All</button>
          {categories.map((item) => (
            <button key={item.id} type="button" onClick={() => setCategory(item.id)} className={`dp-ui min-h-11 rounded-full px-3 text-[13px] font-extrabold ${category === item.id ? 'bg-[#0E857A] text-white' : 'border border-[#BFE3DD] bg-white text-[#0A6159]'}`}>
              {item.label}
            </button>
          ))}
        </div>
        {shown.length === 0 ? <div className="mt-4"><EmptyNote title="No plan matches" sentence="Try another word, or clear the filter." /></div> : null}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {shown.map((plan) => {
            const on = selected?.slug === plan.slug
            return (
              <li key={plan.slug}>
                <button type="button" onClick={() => { setSlug(plan.slug); setPhase(0) }} className={`flex min-h-[118px] w-full flex-col rounded-[20px] bg-white p-4 text-left ${on ? 'outline outline-2 outline-[#0E857A]' : ''}`}>
                  <span className="dp-ui text-[11px] font-extrabold tracking-[0.08em] text-[#0E857A]" style={{ textTransform: 'uppercase' }}>{plan.categoryLabel}</span>
                  <span className="dp-ui mt-1 text-[16px] font-extrabold leading-snug text-[#15202B]">{plan.name}</span>
                  <span className="mt-1 text-[13px] text-[#5b6773]">{plan.exerciseCount} exercises{usage[plan.slug] ? ` · with ${usage[plan.slug]}` : ''}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      <aside className="h-fit rounded-[22px] bg-white p-5 shadow-[0_14px_30px_-18px_rgba(21,32,43,0.3)]" style={{ boxShadow: 'inset 0 6px 0 #0E857A, 0 14px 30px -18px rgba(21,32,43,0.3)' }}>
        {selected ? (
          <>
            <p className="dp-ui text-[11px] font-extrabold tracking-[0.1em] text-[#0E857A]" style={{ textTransform: 'uppercase' }}>Preview</p>
            <h2 className="dp-ui mt-1 text-[20px] font-extrabold leading-tight text-[#15202B]">{selected.name}</h2>
            <p className="mt-1 text-[14px] leading-snug text-[#5b6773]">{selected.objective}</p>
            {selected.phases.length > 1 ? (
              <div className="mt-3 flex gap-1 rounded-xl bg-[#DCF1EE] p-1">
                {selected.phases.map((item, index) => (
                  <button key={item.name} type="button" onClick={() => setPhase(index)} className={`dp-ui min-h-11 flex-1 rounded-lg text-[13px] font-extrabold ${index === phase ? 'bg-[#0E857A] text-white' : 'text-[#0A6159]'}`}>
                    {item.name}
                  </button>
                ))}
              </div>
            ) : null}
            <ol className="mt-3 space-y-1">
              {(phaseRow?.exercises || []).slice(0, 8).map((name, index) => (
                <li key={`${name}-${index}`} className="flex items-center gap-2 text-[14px] text-[#15202B]">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#DCF1EE] dp-ui text-[12px] font-extrabold text-[#0A6159]">{index + 1}</span>
                  {name}
                </li>
              ))}
            </ol>
            {(phaseRow?.exercises.length || 0) > 8 ? <p className="mt-1 text-[12px] text-[#6b7785]">+{(phaseRow?.exercises.length || 0) - 8} more in this phase</p> : null}
            <div className="mt-4">
              {members.length === 0 ? (
                <p className="text-[14px] text-[#5b6773]">When a community member chooses you as their home doctor, you can assign this plan.</p>
              ) : (
                <>
                  <label className="block text-[13px] font-bold text-[#0A6159]">
                    Assign to
                    <select value={memberId} onChange={(event) => setMemberId(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#D7DEE6] px-3 text-[14px] font-normal text-[#15202B]">
                      {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
                    </select>
                  </label>
                  <label className="mt-2 block text-[13px] font-bold text-[#0A6159]">
                    Note, optional
                    <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-1 h-11 w-full rounded-xl border border-[#D7DEE6] px-3 text-[14px] font-normal text-[#15202B]" />
                  </label>
                  <button type="button" disabled={pending} onClick={assign} className="dp-ui mt-3 flex h-[52px] w-full items-center justify-center rounded-2xl bg-[#0E857A] text-[16px] font-extrabold text-white disabled:opacity-60">
                    {pending ? 'Assigning…' : 'Assign this plan'}
                  </button>
                </>
              )}
              {error ? <p className="mt-2 text-[14px] text-[#B4501A]" role="alert">{error}</p> : null}
              {saved ? <p className="mt-2 text-[14px] text-[#0A6159]" role="status">{saved}</p> : null}
            </div>
          </>
        ) : <EmptyNote title="Pick a plan" sentence="The library is on the left. The preview shows the exercises before you assign them." />}
      </aside>
    </div>
  )
}
