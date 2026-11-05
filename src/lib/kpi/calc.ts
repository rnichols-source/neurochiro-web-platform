import {
  DEFAULT_CALENDAR,
  isClosedDay,
  monthEnd,
  monthStartOf,
  openDayCount,
  yearOpenGoal,
  consistencyWithCalendar,
  type OfficeCalendar,
} from './calendar.ts'
import {
  compareYmd,
  diffDays,
  periodRange,
  previousPeriodRange,
  shiftYmd,
  shortLabel,
  weekStartMonday,
} from './dates.ts'
import { FORMULAS } from './library.ts'
import type {
  GoalPeriod,
  GoalStatus,
  KpiAggregation,
  KpiDefinition,
  KpiDirection,
  KpiValue,
  PeriodKey,
} from './types.ts'

export type ValueIndex = Map<string, Map<string, number>>

export function indexValues(values: KpiValue[]): ValueIndex {
  const indexed: ValueIndex = new Map()
  for (const value of values) {
    let dates = indexed.get(value.definitionId)
    if (!dates) {
      dates = new Map()
      indexed.set(value.definitionId, dates)
    }
    dates.set(value.date, value.value)
  }
  return indexed
}

export function indexBySlug(definitions: KpiDefinition[]): Map<string, KpiDefinition> {
  return new Map(definitions.map((definition) => [definition.slug, definition]))
}

function formulaInputs(formula: string): string[] {
  const spec = FORMULAS[formula]
  if (!spec) return []
  return [...spec.numerator, ...spec.denominator]
}

export function usesWeeklyInputs(definition: KpiDefinition, bySlug: Map<string, KpiDefinition>): boolean {
  if (definition.frequency === 'weekly') return true
  if (definition.kind !== 'calculated' || !definition.formula) return false
  return formulaInputs(definition.formula).some((slug) => bySlug.get(slug)?.frequency === 'weekly')
}

export function currentSpan(
  definition: KpiDefinition,
  period: PeriodKey,
  today: string,
  bySlug: Map<string, KpiDefinition>,
): { start: string; end: string } {
  if (period === 'today' && usesWeeklyInputs(definition, bySlug)) {
    return { start: weekStartMonday(today), end: today }
  }
  return periodRange(period, today)
}

export function previousSpan(
  definition: KpiDefinition,
  period: PeriodKey,
  today: string,
  bySlug: Map<string, KpiDefinition>,
): { start: string; end: string } {
  if (period === 'today' && usesWeeklyInputs(definition, bySlug)) {
    const start = shiftYmd(weekStartMonday(today), -7)
    const elapsed = diffDays(weekStartMonday(today), today)
    return { start, end: shiftYmd(start, elapsed) }
  }
  return previousPeriodRange(period, today)
}

function aggregate(
  kind: KpiAggregation,
  dates: Map<string, number> | undefined,
  start: string,
  end: string,
  calendar: OfficeCalendar,
): number | null {
  if (!dates || dates.size === 0) return null
  if (kind === 'ratio') return null
  if (kind === 'latest') {
    let bestDate: string | null = null
    let best: number | null = null
    for (const [date, value] of dates) {
      if (compareYmd(date, start) < 0 || compareYmd(date, end) > 0) continue
      if (bestDate == null || compareYmd(date, bestDate) > 0) {
        bestDate = date
        best = value
      }
    }
    return best
  }
  let sum = 0
  let count = 0
  for (const [date, value] of dates) {
    if (compareYmd(date, start) < 0 || compareYmd(date, end) > 0) continue
    if (kind === 'average' && isClosedDay(date, calendar)) continue
    if (!Number.isFinite(value)) continue
    sum += value
    count += 1
  }
  if (count === 0) return null
  if (kind === 'average') return sum / count
  return sum
}

function partsSum(slugs: string[], getValue: (slug: string) => number | null): number | null {
  let any = false
  let sum = 0
  for (const slug of slugs) {
    const value = getValue(slug)
    if (value == null) continue
    any = true
    sum += value
  }
  return any ? sum : null
}

export function evaluateFormula(formula: string, getValue: (slug: string) => number | null): number | null {
  const spec = FORMULAS[formula]
  if (!spec) return null
  const numerator = partsSum(spec.numerator, getValue)
  const denominator = partsSum(spec.denominator, getValue)
  if (numerator == null || denominator == null || denominator === 0) return null
  return (numerator / denominator) * spec.scale
}

export function metricValueBetween(
  definition: KpiDefinition,
  bySlug: Map<string, KpiDefinition>,
  indexed: ValueIndex,
  start: string,
  end: string,
  visiting: Set<string> = new Set(),
  calendar: OfficeCalendar = DEFAULT_CALENDAR,
): number | null {
  if (definition.kind === 'calculated') {
    if (!definition.formula || visiting.has(definition.slug)) return null
    visiting.add(definition.slug)
    const value = evaluateFormula(definition.formula, (slug) => {
      const component = bySlug.get(slug)
      if (!component) return null
      return metricValueBetween(component, bySlug, indexed, start, end, visiting, calendar)
    })
    visiting.delete(definition.slug)
    return value
  }
  return aggregate(definition.aggregation, indexed.get(definition.id), start, end, calendar)
}

export function metricValue(
  definition: KpiDefinition,
  bySlug: Map<string, KpiDefinition>,
  indexed: ValueIndex,
  period: PeriodKey,
  today: string,
  calendar: OfficeCalendar = DEFAULT_CALENDAR,
): number | null {
  const span = currentSpan(definition, period, today, bySlug)
  return metricValueBetween(definition, bySlug, indexed, span.start, span.end, new Set(), calendar)
}

export function scaledGoal(
  definition: KpiDefinition,
  period: PeriodKey,
  today: string,
  bySlug: Map<string, KpiDefinition>,
  calendar: OfficeCalendar = DEFAULT_CALENDAR,
): number | null {
  if (definition.goalValue == null) return null
  if (definition.aggregation === 'ratio' || definition.aggregation === 'latest' || definition.unit === 'percent' || definition.aggregation === 'average') {
    return definition.goalValue
  }
  const goal = definition.goalValue
  const periodKind: GoalPeriod = definition.goalPeriod ?? (definition.frequency === 'weekly' ? 'weekly' : 'daily')
  const span = currentSpan(definition, period, today, bySlug)
  const open = openDayCount(span.start, span.end, calendar)
  if (open === 0) return null
  const usualWeek = Math.max(calendar.openWeekdays.length, 1)
  if (periodKind === 'daily') return goal * open
  if (periodKind === 'weekly') return goal * (open / usualWeek)
  if (period === 'ytd') return yearOpenGoal(goal, today, calendar)
  const fullMonth = openDayCount(monthStartOf(today), monthEnd(today), calendar)
  if (fullMonth === 0) return null
  return goal * (open / fullMonth)
}

export function goalStatus(value: number | null, goal: number | null, direction: KpiDirection): GoalStatus {
  if (value == null || goal == null) return 'none'
  if (direction === 'lower') {
    if (value <= goal) return 'good'
    if (goal === 0) return 'behind'
    if (value <= goal * 1.2) return 'close'
    return 'behind'
  }
  if (goal === 0) return value > 0 ? 'good' : 'behind'
  if (value >= goal) return 'good'
  if (value >= goal * 0.8) return 'close'
  return 'behind'
}

export function periodChange(current: number | null, previous: number | null): { delta: number | null; percent: number | null } {
  if (current == null || previous == null) return { delta: null, percent: null }
  const delta = current - previous
  if (previous === 0) return { delta, percent: null }
  return { delta, percent: (delta / previous) * 100 }
}

export type TrendPoint = { label: string; value: number | null }

export function trendSeries(
  definition: KpiDefinition,
  bySlug: Map<string, KpiDefinition>,
  indexed: ValueIndex,
  today: string,
  calendar: OfficeCalendar = DEFAULT_CALENDAR,
): TrendPoint[] {
  if (usesWeeklyInputs(definition, bySlug)) {
    const endMonday = weekStartMonday(today)
    const points: TrendPoint[] = []
    for (let i = 7; i >= 0; i -= 1) {
      const start = shiftYmd(endMonday, -7 * i)
      const end = shiftYmd(start, 6)
      const capped = compareYmd(end, today) > 0 ? today : end
      points.push({
        label: shortLabel(start),
        value: metricValueBetween(definition, bySlug, indexed, start, capped, new Set(), calendar),
      })
    }
    return points
  }
  const points: TrendPoint[] = []
  for (let i = 13; i >= 0; i -= 1) {
    const date = shiftYmd(today, -i)
    points.push({
      label: shortLabel(date),
      value: metricValueBetween(definition, bySlug, indexed, date, date, new Set(), calendar),
    })
  }
  return points
}

export function consistency(
  dates: Iterable<string>,
  today: string,
  calendar: OfficeCalendar = DEFAULT_CALENDAR,
): { current: number; longest: number; last7: number } {
  return consistencyWithCalendar(dates, today, calendar)
}

export function comparisonPhraseKey(period: PeriodKey, weekly: boolean): 'yesterday' | 'last week' | 'last month' | 'last year' {
  if (period === 'today') return weekly ? 'last week' : 'yesterday'
  if (period === 'wtd') return 'last week'
  if (period === 'mtd') return 'last month'
  return 'last year'
}

export const PERIODS: PeriodKey[] = ['today', 'wtd', 'mtd', 'ytd']

export function loggedDatesFromValues(values: KpiValue[], extra: string[] = []): string[] {
  const set = new Set(extra)
  for (const value of values) set.add(value.date)
  return Array.from(set)
}
