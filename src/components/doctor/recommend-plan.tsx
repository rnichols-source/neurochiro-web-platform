'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { recommendHomePlan } from '@/lib/doctor/pipeline-actions'

type PlanChoice = { slug: string; name: string }
type CustomSet = { id: string; title: string }

export function RecommendPlan({
  source,
  sourceId,
  plans,
  customSets,
  highlight,
}: {
  source: string
  sourceId: string
  plans: PlanChoice[]
  customSets: CustomSet[]
  highlight?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [writing, setWriting] = useState(false)
  const [title, setTitle] = useState('')
  const [steps, setSteps] = useState('')
  const [note, setNote] = useState('')
  const [message, setMessage] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()
  const quick = useMemo(() => {
    const picks: { key: string; label: string; plan: Parameters<typeof recommendHomePlan>[0]['plan'] }[] = customSets.slice(0, 2).map((set) => ({
      key: set.id,
      label: set.title,
      plan: { kind: 'custom', setId: set.id },
    }))
    const preferred = ['daily-spinal-hygiene', 'neck-pain', 'low-back-relief']
    const rank = (slug: string) => {
      const index = preferred.indexOf(slug)
      return index === -1 ? 99 : index
    }
    const ranked = [...plans].sort((a, b) => rank(a.slug) - rank(b.slug))
    const library = (preferred.some((slug) => plans.some((plan) => plan.slug === slug))
      ? ranked.filter((plan) => preferred.includes(plan.slug))
      : ranked
    ).slice(0, 3)
    for (const plan of library) {
      if (picks.length >= 4) break
      picks.push({ key: plan.slug, label: plan.name, plan: { kind: 'library', slug: plan.slug } })
    }
    return picks
  }, [customSets, plans])
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? plans.filter((plan) => plan.name.toLowerCase().includes(q)) : plans
    return list.slice(0, 12)
  }, [plans, query])

  function send(plan: Parameters<typeof recommendHomePlan>[0]['plan']) {
    setMessage('')
    start(async () => {
      const result = await recommendHomePlan({ source, sourceId, plan })
      setMessage(result.ok ? (result.message || 'Sent.') : result.error)
      if (result.ok) router.refresh()
    })
  }

  return (
    <div className={`mt-4 rounded-2xl p-4 ${highlight ? 'bg-[#DCF1EE]' : 'bg-[#F5F3EF]'}`}>
      <p className="dp-ui text-[15px] font-extrabold text-[#15202B]">Send a home plan</p>
      <p className="mt-1 text-[13px] text-[#5b6773]">One tap sends it. If they are not on the app, it uses the email they already shared.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {quick.map((item) => (
          <button key={item.key} type="button" disabled={pending} onClick={() => send(item.plan)} className="dp-ui min-h-11 rounded-xl bg-[#0E857A] px-3 text-left text-[14px] font-extrabold text-white disabled:opacity-60">
            {pending ? 'Sending…' : item.label}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setOpen((value) => !value)} className="dp-ui mt-3 min-h-11 text-[14px] font-extrabold text-[#0A6159]">
        {open ? 'Hide the full list' : 'All plans'}
      </button>
      {open ? (
        <div className="mt-2">
      {customSets.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {customSets.map((set) => (
            <button key={set.id} type="button" disabled={pending} onClick={() => send({ kind: 'custom', setId: set.id })} className="dp-ui min-h-11 rounded-xl bg-white px-3 text-[14px] font-extrabold text-[#0A6159]">
              {set.title}
            </button>
          ))}
        </div>
      ) : null}
      <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the library" className="mt-3 h-11 w-full rounded-xl border border-[#D7DEE6] px-3 text-[14px]" />
      <div className="mt-2 flex max-h-52 flex-wrap gap-2 overflow-y-auto">
        {shown.map((plan) => (
          <button key={plan.slug} type="button" disabled={pending} onClick={() => send({ kind: 'library', slug: plan.slug })} className="dp-ui min-h-11 rounded-xl bg-white px-3 text-left text-[14px] font-bold text-[#15202B]">
            {plan.name}
          </button>
        ))}
      </div>
      <button type="button" onClick={() => setWriting((value) => !value)} className="dp-ui mt-3 min-h-11 text-[14px] font-extrabold text-[#0A6159]">
        {writing ? 'Hide the short set' : 'Write a short set'}
      </button>
      {writing ? (
        <div className="mt-2 space-y-2">
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Title" className="h-11 w-full rounded-xl border border-[#D7DEE6] px-3 text-[14px]" />
          <textarea value={steps} onChange={(event) => setSteps(event.target.value)} rows={4} placeholder="One step per line, up to 8" className="w-full rounded-xl border border-[#D7DEE6] px-3 py-2 text-[14px]" />
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Note, optional" className="h-11 w-full rounded-xl border border-[#D7DEE6] px-3 text-[14px]" />
          <button type="button" disabled={pending} onClick={() => send({ kind: 'new', title, note, stepsText: steps })} className="dp-ui inline-flex h-11 items-center rounded-xl bg-[#0E857A] px-4 text-[14px] font-extrabold text-white">
            {pending ? 'Sending…' : 'Send this set'}
          </button>
        </div>
      ) : null}
        </div>
      ) : null}
      {message ? <p className="mt-3 text-[14px] text-[#15202B]" role="status">{message}</p> : null}
    </div>
  )
}
