'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { filterSummaries, type LibrarySummary } from '@/lib/community/library-model'

export function LibraryBrowser({
  plans,
  categories,
}: {
  plans: LibrarySummary[]
  categories: { id: string; label: string }[]
}) {
  const [category, setCategory] = useState('all')
  const [query, setQuery] = useState('')
  const shown = useMemo(() => filterSummaries(plans, category, query), [plans, category, query])

  return (
    <div className="space-y-4">
      <label className="block text-sm font-semibold text-portal-ink">
        Search plans
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="mt-1 min-h-11 w-full rounded-lg border border-portal-border px-3 text-sm font-normal"
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory('all')}
          aria-pressed={category === 'all'}
          className={`min-h-11 rounded-full px-3 text-sm font-semibold ${category === 'all' ? 'bg-portal-ink text-white' : 'border border-portal-border bg-white text-portal-ink'}`}
        >
          All
        </button>
        {categories.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setCategory(item.id)}
            aria-pressed={category === item.id}
            className={`min-h-11 rounded-full px-3 text-sm font-semibold ${category === item.id ? 'bg-portal-ink text-white' : 'border border-portal-border bg-white text-portal-ink'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <ul className="divide-y divide-portal-border rounded-2xl border border-portal-border bg-white">
        {shown.map((plan) => (
          <li key={plan.slug}>
            <Link href={`/doctor/care-sets/${plan.slug}`} className="block min-h-11 px-4 py-3">
              <span className="block text-sm font-bold text-portal-ink">{plan.name}</span>
              <span className="mt-1 block text-sm text-portal-ink-2">{plan.exerciseCount} exercises · {plan.objective}</span>
            </Link>
          </li>
        ))}
      </ul>
      {shown.length === 0 ? <p className="text-sm text-portal-ink-2">No plan matches that search.</p> : null}
    </div>
  )
}
