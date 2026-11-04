import { comparisonPhraseKey, currentSpan, goalStatus, metricValueBetween, periodChange, previousSpan, scaledGoal, usesWeeklyInputs, type ValueIndex } from './calc.ts'
import { formatMoney } from './currency.ts'
import type { GoalStatus, KpiDefinition, KpiUnit, PeriodKey } from './types.ts'

export const DASH = '—'

export function formatKpiValue(value: number | null, unit: KpiUnit, currency = 'USD'): string {
  if (value == null || !Number.isFinite(value)) return DASH
  if (unit === 'percent') {
    const rounded = Math.round(value * 10) / 10
    const clean = Object.is(rounded, -0) ? 0 : rounded
    return Number.isInteger(clean) ? `${clean}%` : `${clean.toFixed(1)}%`
  }
  if (unit === 'currency') return formatMoney(value, currency)
  if (unit === 'count') return Math.round(value).toLocaleString('en-US')
  const rounded = Math.round(value * 100) / 100
  return rounded.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

export function goalLine(
  value: number | null,
  goal: number | null,
  direction: KpiDefinition['direction'],
  unit: KpiUnit,
  currency: string,
): string {
  if (value == null) return 'No number yet'
  if (goal == null) return 'No goal set'
  const goalText = formatKpiValue(goal, unit, currency)
  if (direction === 'lower') {
    if (value <= goal) return `Stay under ${goalText} · met`
    return `Stay under ${goalText} · ${formatKpiValue(value - goal, unit, currency)} over`
  }
  if (value >= goal) return `Goal ${goalText} · met`
  return `Goal ${goalText} · ${formatKpiValue(goal - value, unit, currency)} to go`
}

const COMPARE_WITH: Record<'yesterday' | 'last week' | 'last month' | 'last year', string> = {
  yesterday: 'yesterday',
  'last week': 'the same days last week',
  'last month': 'the same days last month',
  'last year': 'the same days last year',
}

export function comparisonLine(
  definition: KpiDefinition,
  period: PeriodKey,
  delta: number | null,
  currency: string,
  weekly: boolean,
): { text: string; tone: 'good' | 'bad' | 'flat' } | null {
  if (delta == null || !Number.isFinite(delta)) return null
  const against = COMPARE_WITH[comparisonPhraseKey(period, weekly)]
  if (delta === 0) return { text: `Same as ${against}`, tone: 'flat' }
  const amount = formatKpiValue(Math.abs(delta), definition.unit === 'percent' ? 'number' : definition.unit, currency)
  const more = delta > 0
  const word = definition.unit === 'percent'
    ? (more ? 'points higher than' : 'points lower than')
    : (more ? 'more than' : 'less than')
  const tone = more
    ? (definition.direction === 'higher' ? 'good' : 'bad')
    : (definition.direction === 'lower' ? 'good' : 'bad')
  return { text: `${amount} ${word} ${against}`, tone }
}

export type PeriodSnapshot = {
  value: number | null
  goal: number | null
  status: GoalStatus
  delta: number | null
  percent: number | null
  comparison: { text: string; tone: 'good' | 'bad' | 'flat' } | null
}

export function snapshotFor(
  definition: KpiDefinition,
  bySlug: Map<string, KpiDefinition>,
  indexed: ValueIndex,
  period: PeriodKey,
  today: string,
  currency: string,
): PeriodSnapshot {
  const current = currentSpan(definition, period, today, bySlug)
  const previous = previousSpan(definition, period, today, bySlug)
  const value = metricValueBetween(definition, bySlug, indexed, current.start, current.end)
  const prior = metricValueBetween(definition, bySlug, indexed, previous.start, previous.end)
  const change = periodChange(value, prior)
  const goal = scaledGoal(definition, period, today, bySlug)
  const weekly = usesWeeklyInputs(definition, bySlug)
  return {
    value,
    goal,
    status: goalStatus(value, goal, definition.direction),
    delta: change.delta,
    percent: change.percent,
    comparison: comparisonLine(definition, period, change.delta, currency, weekly),
  }
}
