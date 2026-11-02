'use client'

import { useState } from 'react'
import type { GapSummary } from '@/lib/admin/coverage-types'

export default function GapPanel({
  gaps,
  onSelect,
}: {
  gaps: GapSummary[]
  onSelect: (gap: GapSummary) => void
}) {
  const [open, setOpen] = useState(false)
  return (
    <section className={`absolute inset-x-0 bottom-0 z-20 overflow-hidden rounded-t-2xl border border-black/10 bg-white shadow-lg md:inset-x-auto md:right-3 md:bottom-3 md:max-h-[40vh] md:w-96 ${open ? 'max-h-[40vh]' : 'h-14'}`}>
      <button
        type="button"
        className="flex h-14 w-full items-center justify-between bg-white px-4 md:pointer-events-none"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="flex items-center gap-2">
          <span className="h-1 w-10 rounded-full bg-neuro-navy/30 md:hidden" aria-hidden="true" />
          <span className="font-heading text-sm font-bold text-neuro-navy">Recruit here</span>
        </span>
        <span className="text-xs text-neuro-gray">{gaps.length}</span>
      </button>
      <div className={`${open ? 'block' : 'hidden'} max-h-[calc(40vh-3.5rem)] overflow-y-auto md:block`}>
        {gaps.length === 0 ? (
          <p className="px-4 pb-4 text-sm text-neuro-gray">No gaps in this view.</p>
        ) : (
          <ul className="px-2 pb-3">
            {gaps.map((gap) => (
              <li key={gap.id}>
                <button
                  type="button"
                  className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl px-2 text-left hover:bg-neuro-cream"
                  onClick={() => onSelect(gap)}
                >
                  <span className="text-sm text-neuro-navy">{gap.label}</span>
                  <span className="shrink-0 text-xs text-neuro-gray">
                    {gap.demandCount} · {gap.nearestMiles == null ? 'no doctor' : `${Math.round(gap.nearestMiles)} mi`}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
