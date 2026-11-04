'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { currencySymbol } from '@/lib/kpi/currency'
import type { CustomKpiInput, GoalPeriod, KpiDefinition, KpiUnit, OfficeMember } from '@/lib/kpi/types'
import OfficeExtras from './OfficeExtras'

type GoalResult = { ok: true; goalValue: number | null; goalPeriod: GoalPeriod | null } | { ok: false; error: string }

function ordered(definitions: KpiDefinition[]) {
  return [...definitions].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

function rateLike(definition: KpiDefinition) {
  return definition.aggregation === 'ratio' || definition.aggregation === 'latest' || definition.aggregation === 'average' || definition.unit === 'percent'
}

export default function KpiSettings({
  definitions,
  currency,
  onToggle,
  onMove,
  onGoal,
  onCreate,
  onRename,
  openWeekdays,
  closedDates,
  isOwner,
  members,
  onSaveWeekdays,
  onAddClosed,
  onRemoveClosed,
  onInvite,
  onRemoveMember,
}: {
  definitions: KpiDefinition[]
  currency: string
  openWeekdays: number[]
  closedDates: string[]
  isOwner: boolean
  members: OfficeMember[]
  onSaveWeekdays: (days: number[]) => Promise<{ ok: boolean; error?: string }>
  onAddClosed: (date: string, note: string) => Promise<{ ok: boolean; error?: string }>
  onRemoveClosed: (date: string) => Promise<{ ok: boolean; error?: string }>
  onInvite: (email: string, role: 'associate' | 'front_desk', canViewPl: boolean) => Promise<{ ok: boolean; error?: string }>
  onRemoveMember: (id: string) => Promise<{ ok: boolean; error?: string }>
  onToggle: (id: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>
  onMove: (id: string, direction: 'up' | 'down') => Promise<{ ok: boolean; error?: string }>
  onGoal: (id: string, goalValue: number | null, goalPeriod: GoalPeriod | null) => Promise<GoalResult>
  onCreate: (input: CustomKpiInput) => Promise<{ ok: true } | { ok: false; error: string }>
  onRename: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const enabled = ordered(definitions).filter((definition) => definition.enabled)
  const hidden = ordered(definitions).filter((definition) => !definition.enabled)
  return (
    <div className="space-y-5" data-testid="kpi-settings">
      <OfficeExtras
        openWeekdays={openWeekdays}
        closedDates={closedDates}
        isOwner={isOwner}
        members={members}
        onSaveWeekdays={onSaveWeekdays}
        onAddClosed={onAddClosed}
        onRemoveClosed={onRemoveClosed}
        onInvite={onInvite}
        onRemoveMember={onRemoveMember}
      />
      <p className="text-sm text-portal-ink-2">
        Turn measures on or off, change the order, and set a goal. Hiding one keeps every number you already saved. You can turn it back on.
      </p>
      <section className="space-y-3">
        <h2 className="font-bold text-portal-ink">On your scorecard</h2>
        {enabled.length === 0 ? <p className="text-sm text-portal-ink-2">Nothing is turned on yet.</p> : null}
        <ul className="space-y-3">
          {enabled.map((definition, index) => (
            <MeasureRow
              key={definition.id}
              definition={definition}
              currency={currency}
              first={index === 0}
              last={index === enabled.length - 1}
              onToggle={onToggle}
              onMove={onMove}
              onGoal={onGoal}
              onRename={onRename}
            />
          ))}
        </ul>
      </section>
      <section className="space-y-3">
        <h2 className="font-bold text-portal-ink">Hidden</h2>
        <p className="text-sm text-portal-ink-2">Hidden measures keep their history.</p>
        {hidden.length === 0 ? <p className="text-sm text-portal-muted">Nothing is hidden.</p> : null}
        <ul className="space-y-3">
          {hidden.map((definition, index) => (
            <MeasureRow
              key={definition.id}
              definition={definition}
              currency={currency}
              first={index === 0}
              last={index === hidden.length - 1}
              onToggle={onToggle}
              onMove={onMove}
              onGoal={onGoal}
              onRename={onRename}
            />
          ))}
        </ul>
      </section>
      <AddMeasure currency={currency} onCreate={onCreate} />
    </div>
  )
}

function MeasureRow({
  definition,
  currency,
  first,
  last,
  onToggle,
  onMove,
  onGoal,
  onRename,
}: {
  definition: KpiDefinition
  currency: string
  first: boolean
  last: boolean
  onToggle: (id: string, enabled: boolean) => Promise<{ ok: boolean; error?: string }>
  onMove: (id: string, direction: 'up' | 'down') => Promise<{ ok: boolean; error?: string }>
  onGoal: (id: string, goalValue: number | null, goalPeriod: GoalPeriod | null) => Promise<GoalResult>
  onRename: (id: string, name: string) => Promise<{ ok: boolean; error?: string }>
}) {
  const [goal, setGoal] = useState(definition.goalValue == null ? '' : String(definition.goalValue))
  const [period, setPeriod] = useState<GoalPeriod>(definition.goalPeriod || (definition.frequency === 'weekly' ? 'weekly' : 'daily'))
  const [name, setName] = useState(definition.name)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const symbol = definition.unit === 'currency' ? currencySymbol(currency) : ''

  async function saveGoal() {
    setError(null)
    setMessage(null)
    const trimmed = goal.trim()
    const result = await onGoal(definition.id, trimmed === '' ? null : Number(trimmed), rateLike(definition) ? null : period)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setMessage(result.goalValue == null ? 'Goal cleared' : 'Goal saved')
  }

  return (
    <li className="rounded-2xl border border-portal-border bg-white p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex flex-col">
          <button type="button" className="min-h-11 min-w-11 rounded-lg border border-portal-border inline-flex items-center justify-center disabled:opacity-30" aria-label={`Move ${definition.name} up`} disabled={first} onClick={() => onMove(definition.id, 'up')}>
            <ChevronUp className="w-4 h-4" aria-hidden />
          </button>
          <button type="button" className="min-h-11 min-w-11 rounded-lg border border-portal-border inline-flex items-center justify-center disabled:opacity-30" aria-label={`Move ${definition.name} down`} disabled={last} onClick={() => onMove(definition.id, 'down')}>
            <ChevronDown className="w-4 h-4" aria-hidden />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-portal-ink">{definition.name}</p>
          <p className="text-sm text-portal-ink-2">
            {definition.kind === 'calculated' ? 'Calculated' : definition.frequency === 'weekly' ? 'You type this once a week' : 'You type this each day'}
            {' · '}
            {definition.direction === 'lower' ? 'Lower is better' : 'Higher is better'}
          </p>
          <p className="mt-1 text-sm text-portal-ink-2">{definition.formulaText || definition.description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={definition.enabled}
          aria-label={`${definition.enabled ? 'Hide' : 'Show'} ${definition.name}`}
          onClick={async () => {
            setError(null)
            const result = await onToggle(definition.id, !definition.enabled)
            if (!result.ok) setError(result.error || 'Could not update that measure.')
          }}
          className={`min-h-11 min-w-16 rounded-full px-3 text-sm font-bold ${definition.enabled ? 'bg-portal-accent text-white' : 'bg-portal-surface text-portal-ink'}`}
        >
          {definition.enabled ? 'On' : 'Off'}
        </button>
      </div>
      {definition.isCustom ? (
        <div className="flex gap-2">
          <label className="flex-1 text-sm font-bold text-portal-ink-2">
            Name
            <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border px-3 text-base font-bold text-portal-ink" />
          </label>
          <button
            type="button"
            className="self-end min-h-11 px-3 rounded-lg border border-portal-border text-sm font-bold text-portal-ink"
            onClick={async () => {
              setError(null)
              setMessage(null)
              const result = await onRename(definition.id, name)
              if (!result.ok) setError(result.error || 'Could not rename that measure.')
              else setMessage('Name saved')
            }}
          >
            Save name
          </button>
        </div>
      ) : null}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <label className="text-sm font-bold text-portal-ink-2">
          {rateLike(definition) ? 'Target' : 'Goal'}
          <span className="mt-1 flex items-center gap-2 rounded-lg border border-portal-border bg-white px-3">
            {symbol ? <span className="text-portal-ink">{symbol}</span> : null}
            <input
              inputMode="decimal"
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="w-full min-h-11 bg-transparent text-base font-bold text-portal-ink outline-none"
            />
            {definition.unit === 'percent' ? <span className="text-portal-ink">%</span> : null}
          </span>
        </label>
        {rateLike(definition) ? (
          <p className="text-sm text-portal-ink-2 sm:self-end sm:pb-3">This target is the rate itself. It is not multiplied by the number of days.</p>
        ) : (
          <label className="text-sm font-bold text-portal-ink-2">
            Goal is for a
            <select value={period} onChange={(event) => setPeriod(event.target.value as GoalPeriod)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink">
              <option value="daily">Day</option>
              <option value="weekly">Week</option>
              <option value="monthly">Month</option>
            </select>
          </label>
        )}
      </div>
      <button type="button" onClick={saveGoal} className="min-h-11 px-4 rounded-lg bg-portal-ink text-sm font-bold text-white">
        Save goal
      </button>
      {message ? (
        <p className="flex items-center justify-between gap-3 rounded-lg bg-portal-success-bg px-3 py-2 text-sm font-bold text-portal-success" role="status">
          <span>{message}</span>
          <button type="button" className="min-h-11 px-2" onClick={() => setMessage(null)}>Dismiss</button>
        </p>
      ) : null}
      {error ? (
        <p className="flex items-center justify-between gap-3 rounded-lg bg-portal-danger-bg px-3 py-2 text-sm font-bold text-portal-danger" role="status">
          <span>{error}</span>
          <button type="button" className="min-h-11 px-2" onClick={() => setError(null)}>Dismiss</button>
        </p>
      ) : null}
    </li>
  )
}

function AddMeasure({
  currency,
  onCreate,
}: {
  currency: string
  onCreate: (input: CustomKpiInput) => Promise<{ ok: true } | { ok: false; error: string }>
}) {
  const [name, setName] = useState('')
  const [unit, setUnit] = useState<KpiUnit>('count')
  const [frequency, setFrequency] = useState<'daily' | 'weekly'>('daily')
  const [direction, setDirection] = useState<'higher' | 'lower'>('higher')
  const [goal, setGoal] = useState('')
  const [period, setPeriod] = useState<GoalPeriod>('daily')
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function submit() {
    setSaving(true)
    setError(null)
    setMessage(null)
    const result = await onCreate({
      name,
      unit,
      frequency,
      direction,
      goalValue: goal.trim() === '' ? null : Number(goal),
      goalPeriod: unit === 'percent' ? null : period,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setName('')
    setGoal('')
    setMessage('Added. It is on your scorecard.')
  }

  return (
    <section className="rounded-2xl border border-portal-border bg-white p-4 space-y-3">
      <h2 className="font-bold text-portal-ink">Add your own measure</h2>
      <p className="text-sm text-portal-ink-2">Use this for a number the built-in list does not have. Currency uses {currency}.</p>
      <label className="block text-sm font-bold text-portal-ink-2">
        Name
        <input value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
      </label>
      <label className="block text-sm font-bold text-portal-ink-2">
        What kind of number
        <select value={unit} onChange={(event) => setUnit(event.target.value as KpiUnit)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink">
          <option value="count">A count</option>
          <option value="currency">Money</option>
          <option value="percent">A percent you type in</option>
          <option value="number">A plain number</option>
        </select>
      </label>
      <label className="block text-sm font-bold text-portal-ink-2">
        How often you enter it
        <select value={frequency} onChange={(event) => setFrequency(event.target.value as 'daily' | 'weekly')} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink">
          <option value="daily">Every day</option>
          <option value="weekly">Once a week</option>
        </select>
      </label>
      <label className="block text-sm font-bold text-portal-ink-2">
        Which way is better
        <select value={direction} onChange={(event) => setDirection(event.target.value as 'higher' | 'lower')} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink">
          <option value="higher">Higher is better</option>
          <option value="lower">Lower is better</option>
        </select>
      </label>
      <label className="block text-sm font-bold text-portal-ink-2">
        Goal, if you want one
        <input inputMode="decimal" value={goal} onChange={(event) => setGoal(event.target.value)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border px-3 text-base text-portal-ink" />
      </label>
      {unit === 'percent' ? null : (
        <label className="block text-sm font-bold text-portal-ink-2">
          Goal is for a
          <select value={period} onChange={(event) => setPeriod(event.target.value as GoalPeriod)} className="mt-1 w-full min-h-11 rounded-lg border border-portal-border bg-white px-3 text-base text-portal-ink">
            <option value="daily">Day</option>
            <option value="weekly">Week</option>
            <option value="monthly">Month</option>
          </select>
        </label>
      )}
      <button type="button" disabled={saving} onClick={submit} className="w-full min-h-11 rounded-lg bg-portal-accent text-sm font-bold text-white disabled:opacity-60">
        {saving ? 'Adding…' : 'Add measure'}
      </button>
      {message ? (
        <p className="flex items-center justify-between gap-3 rounded-lg bg-portal-success-bg px-3 py-2 text-sm font-bold text-portal-success" role="status">
          <span>{message}</span>
          <button type="button" className="min-h-11 px-2" onClick={() => setMessage(null)}>Dismiss</button>
        </p>
      ) : null}
      {error ? (
        <p className="flex items-center justify-between gap-3 rounded-lg bg-portal-danger-bg px-3 py-2 text-sm font-bold text-portal-danger" role="status">
          <span>{error}</span>
          <button type="button" className="min-h-11 px-2" onClick={() => setError(null)}>Dismiss</button>
        </p>
      ) : null}
    </section>
  )
}
