'use client'

import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { consistency, indexBySlug, indexValues, metricValue } from '@/lib/kpi/calc'
import { compareYmd, longLabel, shiftYmd, weekRangeLabel } from '@/lib/kpi/dates'
import { formatKpiValue } from '@/lib/kpi/format'
import type { KpiDefinition, KpiValue, PeriodKey } from '@/lib/kpi/types'
import { parseEntryValue, storageDateFor } from '@/lib/kpi/validate'
import Keypad, { pushDigit } from './Keypad'

type SaveResult = { ok: true; savedDate: string } | { ok: false; error: string }

function ordered(definitions: KpiDefinition[]) {
  return [...definitions].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export default function KpiToday({
  definitions,
  values,
  loggedDates,
  today,
  currency,
  onSave,
  onEdit,
}: {
  definitions: KpiDefinition[]
  values: KpiValue[]
  loggedDates: string[]
  today: string
  currency: string
  onSave: (definitionId: string, date: string, value: number | null) => Promise<SaveResult>
  onEdit: () => void
}) {
  const entered = ordered(definitions).filter((definition) => definition.enabled && definition.kind === 'entered')
  const calculated = ordered(definitions).filter((definition) => definition.enabled && definition.kind === 'calculated')
  const [selectedDate, setSelectedDate] = useState(today)
  const [index, setIndex] = useState(0)
  const safeIndex = entered.length === 0 ? 0 : Math.min(index, entered.length - 1)
  const current = entered[safeIndex]
  const stats = consistency(loggedDates, today)

  return (
    <div className="space-y-4" data-testid="kpi-today">
      <div className="flex items-center justify-between gap-2">
        <button type="button" className="min-h-11 min-w-11 rounded-lg border border-portal-border bg-white inline-flex items-center justify-center" aria-label="Previous day" onClick={() => setSelectedDate((date) => shiftYmd(date, -1))}>
          <ChevronLeft className="w-5 h-5" aria-hidden />
        </button>
        <div className="text-center min-w-0">
          <p className="font-bold text-portal-ink">{longLabel(selectedDate)}</p>
          <p className="text-sm text-portal-ink-2">{selectedDate === today ? 'Today' : 'Earlier day'}</p>
        </div>
        <button type="button" className="min-h-11 min-w-11 rounded-lg border border-portal-border bg-white inline-flex items-center justify-center disabled:opacity-40" aria-label="Next day" disabled={selectedDate === today} onClick={() => setSelectedDate((date) => (compareYmd(date, today) < 0 ? shiftYmd(date, 1) : date))}>
          <ChevronRight className="w-5 h-5" aria-hidden />
        </button>
      </div>
      <label className="block text-sm font-bold text-portal-ink-2">
        Jump to a day
        <input
          type="date"
          max={today}
          value={selectedDate}
          onChange={(event) => {
            const next = event.target.value
            if (next && compareYmd(next, today) <= 0) setSelectedDate(next)
          }}
          className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink"
        />
      </label>
      <p className="text-sm text-portal-ink-2">
        {stats.current > 0 ? `${stats.current}-day streak. ` : 'No streak yet. '}
        Logged {stats.last7} of the last 7 days.
      </p>

      {current ? (
        <EntryCard
          key={`${current.id}-${storageDateFor(current, selectedDate)}`}
          definition={current}
          position={safeIndex + 1}
          total={entered.length}
          selectedDate={selectedDate}
          stored={values.find((value) => value.definitionId === current.id && value.date === storageDateFor(current, selectedDate))?.value ?? null}
          currency={currency}
          onEdit={onEdit}
          onSave={onSave}
          onPrevious={() => setIndex((value) => Math.max(0, value - 1))}
          onNext={() => setIndex((value) => Math.min(entered.length - 1, value + 1))}
        />
      ) : (
        <div className="rounded-2xl border border-portal-border bg-white p-5">
          <p className="font-bold text-portal-ink">Nothing to type in</p>
          <p className="mt-1 text-sm text-portal-ink-2">Turn a measure on in the list, or add your own. Calculated numbers fill in on their own.</p>
        </div>
      )}

      {calculated.length > 0 ? (
        <CalculatedToday
          definitions={definitions}
          calculated={calculated}
          values={values}
          selectedDate={selectedDate}
          currency={currency}
        />
      ) : null}
    </div>
  )
}

function EntryCard({
  definition,
  position,
  total,
  selectedDate,
  stored,
  currency,
  onEdit,
  onSave,
  onPrevious,
  onNext,
}: {
  definition: KpiDefinition
  position: number
  total: number
  selectedDate: string
  stored: number | null
  currency: string
  onEdit: () => void
  onSave: (definitionId: string, date: string, value: number | null) => Promise<SaveResult>
  onPrevious: () => void
  onNext: () => void
}) {
  const [draft, setDraft] = useState(stored == null ? '' : String(stored))
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'saved' | 'error'; text: string } | null>(null)
  const allowDecimal = definition.unit !== 'count'
  const week = definition.frequency === 'weekly'

  function edit(next: string) {
    setDraft(next)
    setNotice(null)
    onEdit()
  }

  async function save(goNext: boolean) {
    const trimmed = draft.trim()
    const parsed = trimmed === '' ? null : parseEntryValue(Number(trimmed), definition.unit)
    if (parsed && typeof parsed === 'object' && 'error' in parsed) {
      setNotice({ kind: 'error', text: parsed.error })
      return
    }
    setSaving(true)
    const result = await onSave(definition.id, selectedDate, parsed)
    setSaving(false)
    if (!result.ok) {
      setNotice({ kind: 'error', text: result.error })
      return
    }
    setNotice({ kind: 'saved', text: parsed == null ? 'Cleared' : 'Saved' })
    if (goNext && position < total) onNext()
  }

  return (
    <section className="rounded-2xl border border-portal-border bg-white p-4 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-portal-ink-2">{position} of {total}</p>
          <h2 className="text-xl font-bold text-portal-ink">{definition.name}</h2>
          <p className="mt-1 text-sm text-portal-ink-2">{definition.description}</p>
          {week ? <p className="mt-1 text-sm font-bold text-portal-ink">This week · {weekRangeLabel(selectedDate)}</p> : null}
        </div>
      </div>
      <p className="text-4xl font-bold text-portal-ink tabular-nums" data-testid="kpi-entry-value">
        {draft === '' ? '—' : draft}
      </p>
      {notice ? (
        <div className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-bold ${notice.kind === 'saved' ? 'bg-portal-success-bg text-portal-success' : 'bg-portal-danger-bg text-portal-danger'}`} role="status">
          <span>{notice.text}</span>
          <button type="button" className="min-h-11 px-2" onClick={() => setNotice(null)}>Dismiss</button>
        </div>
      ) : null}
      <Keypad
        allowDecimal={allowDecimal}
        onDigit={(digit) => edit(pushDigit(draft, digit, allowDecimal))}
        onBackspace={() => edit(draft.slice(0, -1))}
        onClear={() => edit('')}
      />
      <div className="grid grid-cols-2 gap-2">
        <button type="button" className="min-h-11 rounded-lg border border-portal-border bg-white text-sm font-bold text-portal-ink disabled:opacity-40" disabled={position === 1} onClick={onPrevious}>
          Previous
        </button>
        <button type="button" className="min-h-11 rounded-lg bg-portal-accent text-sm font-bold text-white disabled:opacity-60" disabled={saving} onClick={() => save(true)}>
          {saving ? 'Saving…' : position === total ? 'Save' : 'Save and next'}
        </button>
      </div>
      <p className="text-sm text-portal-muted">One number per measure per day. Saving again updates it.</p>
      {currency && definition.unit === 'currency' ? <p className="text-sm text-portal-muted">Amounts use your clinic currency ({currency}).</p> : null}
    </section>
  )
}

function CalculatedToday({
  definitions,
  calculated,
  values,
  selectedDate,
  currency,
}: {
  definitions: KpiDefinition[]
  calculated: KpiDefinition[]
  values: KpiValue[]
  selectedDate: string
  currency: string
}) {
  const rows = useMemo(() => {
    const bySlug = indexBySlug(definitions)
    const indexed = indexValues(values)
    return calculated.map((definition) => ({
      definition,
      value: metricValue(definition, bySlug, indexed, 'today' as PeriodKey, selectedDate),
    }))
  }, [calculated, definitions, selectedDate, values])

  return (
    <section className="rounded-2xl border border-portal-border bg-white p-4 space-y-3">
      <h2 className="font-bold text-portal-ink">Calculated for this day</h2>
      <p className="text-sm text-portal-ink-2">These update from the numbers you type. A dash means the math cannot be done yet, including when the bottom number is zero.</p>
      <ul className="space-y-3">
        {rows.map((row) => (
          <li key={row.definition.id}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="font-bold text-portal-ink">{row.definition.name}</p>
              <p className="text-lg font-bold text-portal-ink">{formatKpiValue(row.value, row.definition.unit, currency)}</p>
            </div>
            <p className="text-sm text-portal-ink-2">{row.definition.formulaText}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}
