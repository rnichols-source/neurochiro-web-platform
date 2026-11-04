'use client'

import { useMemo, useState } from 'react'
import { isClosedDay, normalizeCalendar } from '@/lib/kpi/calendar'
import { consistency, indexBySlug, indexValues, trendSeries } from '@/lib/kpi/calc'
import { formatMoney } from '@/lib/kpi/currency'
import { formatKpiValue, goalLine, snapshotFor } from '@/lib/kpi/format'
import type { KpiDefinition, KpiValue, MonthComparison, PeriodKey } from '@/lib/kpi/types'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'wtd', label: 'Week' },
  { key: 'mtd', label: 'Month' },
  { key: 'ytd', label: 'Year' },
]

const STATUS_TEXT: Record<string, string> = {
  good: 'text-portal-success',
  close: 'text-portal-warning',
  behind: 'text-portal-danger',
  none: 'text-portal-ink-2',
}

const TONE_TEXT = {
  good: 'text-portal-success',
  bad: 'text-portal-danger',
  flat: 'text-portal-ink-2',
}

function ordered(definitions: KpiDefinition[]) {
  return [...definitions].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export default function KpiDashboard({
  definitions,
  values,
  loggedDates,
  today,
  currency,
  openWeekdays,
  closedDates,
  plMonths,
  plNote,
}: {
  definitions: KpiDefinition[]
  values: KpiValue[]
  loggedDates: string[]
  today: string
  currency: string
  openWeekdays: number[]
  closedDates: string[]
  plMonths: MonthComparison[] | null
  plNote: string | null
}) {
  const [period, setPeriod] = useState<PeriodKey>('today')
  const visible = ordered(definitions).filter((definition) => definition.enabled)
  const calendar = normalizeCalendar({ openWeekdays, closedDates })
  const stats = consistency(loggedDates, today, calendar)
  const bySlug = useMemo(() => indexBySlug(definitions), [definitions])
  const indexed = useMemo(() => indexValues(values), [values])

  return (
    <div className="space-y-4" data-testid="kpi-dashboard">
      <p className="text-sm text-portal-ink-2">
        {stats.current > 0 ? `${stats.current}-day streak. ` : 'No streak yet. '}
        Logged {stats.last7} of the last 7 days.
        {stats.longest > stats.current ? ` Longest streak: ${stats.longest} days.` : ''}
      </p>
      <div className="grid grid-cols-4 gap-1 rounded-xl border border-portal-border bg-white p-1" role="tablist" aria-label="Time period">
        {PERIODS.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={period === item.key}
            onClick={() => setPeriod(item.key)}
            className={`min-h-11 rounded-lg text-sm font-bold ${period === item.key ? 'bg-portal-accent text-white' : 'text-portal-ink'}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="text-sm text-portal-ink-2">Green means on pace. For no-shows, cancellations, and drop-off, lower is better. Closed days are left out of the goal.</p>
      {plMonths ? <PlCompare months={plMonths} note={plNote} currency={currency} /> : null}
      {visible.length === 0 ? (
        <div className="rounded-2xl border border-portal-border bg-white p-5">
          <p className="font-bold text-portal-ink">Your scorecard is empty</p>
          <p className="mt-1 text-sm text-portal-ink-2">Turn a measure on in the list to see it here.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((definition) => {
            const snap = snapshotFor(definition, bySlug, indexed, period, today, currency, calendar)
            const others = PERIODS.filter((item) => item.key !== period).map((item) => {
              const other = snapshotFor(definition, bySlug, indexed, item.key, today, currency, calendar)
              return `${item.label} ${formatKpiValue(other.value, definition.unit, currency)}`
            })
            return (
              <li key={definition.id} className="rounded-2xl border border-portal-border bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-portal-ink">{definition.name}</p>
                    <p className={`text-sm ${STATUS_TEXT[snap.status]}`}>{definition.direction === 'lower' ? 'Lower is better' : 'Higher is better'}</p>
                  </div>
                  <p className={`text-2xl font-bold ${STATUS_TEXT[snap.status]}`}>{formatKpiValue(snap.value, definition.unit, currency)}</p>
                </div>
                <p className={`mt-2 text-sm font-bold ${STATUS_TEXT[snap.status]}`}>
                  {period === 'today' && isClosedDay(today, calendar) ? 'Office closed · not part of the goal' : goalLine(snap.value, snap.goal, definition.direction, definition.unit, currency)}
                </p>
                {snap.comparison ? <p className={`mt-1 text-sm font-bold ${TONE_TEXT[snap.comparison.tone]}`}>{snap.comparison.text}</p> : <p className="mt-1 text-sm text-portal-muted">No earlier period to compare yet.</p>}
                <p className="mt-2 text-sm text-portal-ink-2">{others.join(' · ')}</p>
                <div className="mt-3 border-t border-portal-border pt-3 space-y-2">
                  <p className="text-sm text-portal-ink-2">{definition.formulaText || definition.description}</p>
                  <Trend definition={definition} bySlug={bySlug} indexed={indexed} today={today} currency={currency} calendar={calendar} />
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function Trend({
  definition,
  bySlug,
  indexed,
  today,
  currency,
  calendar,
}: {
  definition: KpiDefinition
  bySlug: ReturnType<typeof indexBySlug>
  indexed: ReturnType<typeof indexValues>
  today: string
  currency: string
  calendar: ReturnType<typeof normalizeCalendar>
}) {
  const points = trendSeries(definition, bySlug, indexed, today, calendar)
  const numbers = points.map((point) => point.value).filter((value): value is number => value != null)
  if (numbers.length < 2) {
    return <p className="text-sm text-portal-muted">Log a few more days to see a trend.</p>
  }
  const width = 320
  const height = 72
  const min = Math.min(...numbers)
  const max = Math.max(...numbers)
  const span = max - min || 1
  const step = width / Math.max(points.length - 1, 1)
  let path = ''
  let penDown = false
  points.forEach((point, index) => {
    if (point.value == null) {
      penDown = false
      return
    }
    const x = index * step
    const y = height - 8 - ((point.value - min) / span) * (height - 16)
    path += `${penDown ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `
    penDown = true
  })
  return (
    <div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-20" role="img" aria-label={`${definition.name} trend`}>
        <path d={path.trim()} fill="none" stroke="#d66829" strokeWidth="2" />
      </svg>
      <p className="text-sm text-portal-muted">
        {points[0]?.label} to {points[points.length - 1]?.label}. Latest {formatKpiValue(points[points.length - 1]?.value ?? null, definition.unit, currency)}
      </p>
    </div>
  )
}

function PlCompare({ months, note, currency }: { months: MonthComparison[]; note: string | null; currency: string }) {
  return (
    <section className="rounded-2xl border border-portal-border bg-white p-4 space-y-3" data-testid="kpi-pl-compare">
      <h2 className="font-bold text-portal-ink">Collections and the P&L</h2>
      <p className="text-sm text-portal-ink-2">The scorecard total for each month, next to the collections saved on that month’s P&L. Nothing here changes the P&L.</p>
      {note ? <p className="text-sm text-portal-ink-2">{note}</p> : null}
      <ul className="space-y-3">
        {months.map((month) => (
          <li key={month.month} className="rounded-xl bg-portal-surface p-3">
            <p className="font-bold text-portal-ink">{month.month}</p>
            <p className="text-sm text-portal-ink-2">Scorecard {month.kpi == null ? '—' : formatMoney(month.kpi, currency)}</p>
            <p className="text-sm text-portal-ink-2">P&L {month.pl == null ? 'Not saved' : formatMoney(month.pl, currency)}</p>
            <p className="text-sm text-portal-ink-2">Difference {month.difference == null ? '—' : formatMoney(month.difference, currency)}</p>
            {month.flag ? <p className="mt-1 text-sm font-bold text-portal-warning">These differ by more than about 5%. Worth a look.</p> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}
