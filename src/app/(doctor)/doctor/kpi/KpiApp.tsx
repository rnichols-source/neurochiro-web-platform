'use client'

import { useState } from 'react'
import PageHeader from '@/components/portal/PageHeader'
import type { CustomKpiInput, GoalPeriod, KpiDefinition, KpiValue, KpiWorkspace } from '@/lib/kpi/types'
import {
  addClosedDate,
  createCustomKpi,
  inviteOfficeMember,
  moveKpi,
  removeClosedDate,
  removeOfficeMember,
  renameKpi,
  saveKpiValue,
  saveOfficeWeekdays,
  setKpiEnabled,
  setKpiGoal,
} from './actions'
import KpiDashboard from './KpiDashboard'
import KpiSettings from './KpiSettings'
import KpiToday from './KpiToday'

type Tab = 'today' | 'dashboard' | 'settings'

export default function KpiApp({ initial, clientTimeZone }: { initial: KpiWorkspace; clientTimeZone: string }) {
  const [definitions, setDefinitions] = useState(initial.definitions)
  const [values, setValues] = useState(initial.values)
  const [loggedDates, setLoggedDates] = useState(initial.loggedDates)
  const [openWeekdays, setOpenWeekdays] = useState(initial.openWeekdays)
  const [closedDates, setClosedDates] = useState(initial.closedDates)
  const [autoLeadDates, setAutoLeadDates] = useState(initial.autoLeadDates)
  const [members, setMembers] = useState(initial.members)
  const [tab, setTab] = useState<Tab>('today')
  const [banner, setBanner] = useState<{ kind: 'saved' | 'error'; text: string } | null>(null)

  function applyOrder(order: { id: string; sortOrder: number }[]) {
    const next = new Map(order.map((item) => [item.id, item.sortOrder]))
    setDefinitions((current) => current.map((definition) => (
      next.has(definition.id) ? { ...definition, sortOrder: next.get(definition.id) as number } : definition
    )))
  }

  return (
    <div className="max-w-lg mx-auto pb-8" data-testid="kpi-app">
      <PageHeader
        title="KPI tracker"
        description="Log today’s numbers. Choose which measures you track, and set a goal for each."
      />
      <p className="text-sm text-portal-ink-2 -mt-4 mb-4">Dates use your clinic time ({initial.timeZone}). Money is shown in {initial.currency}.</p>
      <div className="grid grid-cols-3 gap-1 rounded-xl border border-portal-border bg-white p-1 mb-4" role="tablist" aria-label="Scorecard sections">
        {([
          ['today', 'Today'],
          ['dashboard', 'Progress'],
          ['settings', 'Your list'],
        ] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            data-testid={`kpi-tab-${key}`}
            onClick={() => setTab(key)}
            className={`min-h-11 rounded-lg text-sm font-bold ${tab === key ? 'bg-portal-accent text-white' : 'text-portal-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {banner ? (
        <div className={`mb-4 flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm font-bold ${banner.kind === 'saved' ? 'bg-portal-success-bg text-portal-success' : 'bg-portal-danger-bg text-portal-danger'}`} role="status">
          <span>{banner.text}</span>
          <button type="button" className="min-h-11 px-2" onClick={() => setBanner(null)}>Dismiss</button>
        </div>
      ) : null}
      {tab === 'today' ? (
        <KpiToday
          definitions={definitions}
          values={values}
          loggedDates={loggedDates}
          today={initial.today}
          currency={initial.currency}
          openWeekdays={openWeekdays}
          closedDates={closedDates}
          autoLeadDates={autoLeadDates}
          onEdit={() => setBanner(null)}
          onSave={async (definitionId, date, value) => {
            const result = await saveKpiValue(definitionId, date, value, clientTimeZone)
            if (!result.ok) {
              setBanner({ kind: 'error', text: result.error })
              return result
            }
            const lead = definitions.find((item) => item.slug === 'neurochiro_leads')
            let nextValues = replaceValue(values, definitionId, result.savedDate, value)
            if (lead && lead.id === definitionId && value == null) {
              const counted = initial.leadCounts.find((item) => item.date === result.savedDate)?.count ?? 0
              nextValues = [...nextValues, { definitionId, date: result.savedDate, value: counted, source: 'auto' }]
            }
            setValues(nextValues)
            setLoggedDates((current) => {
              const set = new Set(current)
              if (value != null) set.add(result.savedDate)
              else if (result.savedDate >= initial.valuesFrom && !nextValues.some((item) => item.date === result.savedDate && item.source !== 'auto')) {
                set.delete(result.savedDate)
              }
              return Array.from(set)
            })
            setBanner({ kind: 'saved', text: value == null ? 'Cleared' : 'Saved' })
            if (lead && lead.id === definitionId) {
              setAutoLeadDates((current) => value == null
                ? Array.from(new Set([...current, result.savedDate]))
                : current.filter((date) => date !== result.savedDate))
            }
            return result
          }}
        />
      ) : null}
      {tab === 'dashboard' ? (
        <KpiDashboard
          definitions={definitions}
          values={values}
          loggedDates={loggedDates}
          today={initial.today}
          currency={initial.currency}
          openWeekdays={openWeekdays}
          closedDates={closedDates}
          plMonths={initial.plMonths}
          plNote={initial.plNote}
        />
      ) : null}
      {tab === 'settings' ? (
        <KpiSettings
          definitions={definitions}
          currency={initial.currency}
          openWeekdays={openWeekdays}
          closedDates={closedDates}
          isOwner={initial.access.role === 'owner'}
          members={members}
          onSaveWeekdays={async (days) => {
            const result = await saveOfficeWeekdays(days)
            if (!result.ok) return result
            setOpenWeekdays(result.openWeekdays)
            setBanner({ kind: 'saved', text: 'Open days saved' })
            return result
          }}
          onAddClosed={async (date, note) => {
            const result = await addClosedDate(date, note)
            if (!result.ok) return result
            setClosedDates((current) => Array.from(new Set([...current, date])).sort())
            setBanner({ kind: 'saved', text: 'Day marked closed' })
            return result
          }}
          onRemoveClosed={async (date) => {
            const result = await removeClosedDate(date)
            if (!result.ok) return result
            setClosedDates((current) => current.filter((item) => item !== date))
            setBanner({ kind: 'saved', text: 'Day reopened' })
            return result
          }}
          onInvite={async (email, role, canViewPl) => {
            const result = await inviteOfficeMember(email, role, canViewPl)
            if (!result.ok) return result
            setMembers((current) => {
              const rest = current.filter((item) => item.email !== result.member.email)
              return [...rest, result.member]
            })
            setBanner({ kind: 'saved', text: 'Invite saved' })
            return result
          }}
          onRemoveMember={async (id) => {
            const result = await removeOfficeMember(id)
            if (!result.ok) return result
            setMembers((current) => current.filter((item) => item.id !== id))
            setBanner({ kind: 'saved', text: 'Removed' })
            return result
          }}
          onToggle={async (id, enabled) => {
            const result = await setKpiEnabled(id, enabled)
            if (!result.ok) {
              setBanner({ kind: 'error', text: result.error })
              return result
            }
            setDefinitions((current) => current.map((definition) => definition.id === id ? { ...definition, enabled } : definition))
            setBanner({ kind: 'saved', text: enabled ? 'Turned on. Past numbers are still there.' : 'Hidden. Past numbers are kept.' })
            return result
          }}
          onMove={async (id, direction) => {
            const result = await moveKpi(id, direction)
            if (!result.ok) {
              setBanner({ kind: 'error', text: result.error })
              return result
            }
            applyOrder(result.order)
            return result
          }}
          onGoal={async (id, goalValue, goalPeriod) => {
            const result = await setKpiGoal(id, goalValue, goalPeriod)
            if (!result.ok) {
              setBanner({ kind: 'error', text: result.error })
              return result
            }
            setDefinitions((current) => current.map((definition) => (
              definition.id === id ? { ...definition, goalValue: result.goalValue, goalPeriod: result.goalPeriod } : definition
            )))
            setBanner({ kind: 'saved', text: 'Goal saved' })
            return result
          }}
          onCreate={async (input: CustomKpiInput) => {
            const result = await createCustomKpi(input)
            if (!result.ok) {
              setBanner({ kind: 'error', text: result.error })
              return result
            }
            setDefinitions((current) => [...current, result.definition])
            setBanner({ kind: 'saved', text: 'Added to your scorecard' })
            return { ok: true }
          }}
          onRename={async (id: string, name: string) => {
            const result = await renameKpi(id, name)
            if (!result.ok) {
              setBanner({ kind: 'error', text: result.error })
              return result
            }
            setDefinitions((current) => current.map((definition) => definition.id === id ? { ...definition, name: result.name } : definition))
            setBanner({ kind: 'saved', text: 'Name saved' })
            return result
          }}
        />
      ) : null}
    </div>
  )
}

export function replaceValue(values: KpiValue[], definitionId: string, date: string, value: number | null): KpiValue[] {
  const next = values.filter((item) => !(item.definitionId === definitionId && item.date === date))
  if (value == null) return next
  next.push({ definitionId, date, value })
  return next
}

export type { GoalPeriod, KpiDefinition }
