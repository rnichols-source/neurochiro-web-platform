import { compareYmd, isValidYmd, shiftYmd, weekStartMonday } from './dates.ts'
import type { CustomKpiInput, GoalPeriod, KpiAggregation, KpiDefinition, KpiUnit } from './types.ts'

const UNITS = new Set<KpiUnit>(['count', 'currency', 'percent', 'number'])
const PERIODS = new Set<GoalPeriod>(['daily', 'weekly', 'monthly'])

export function cleanName(name: string): string | null {
  const trimmed = name.trim().replace(/\s+/g, ' ')
  if (trimmed.length < 2 || trimmed.length > 48) return null
  return trimmed
}

export function aggregationForUnit(unit: KpiUnit): KpiAggregation {
  if (unit === 'percent' || unit === 'number') return 'average'
  return 'sum'
}

export function parseEntryValue(raw: number | null, unit: KpiUnit): number | null | { error: string } {
  if (raw == null) return null
  if (typeof raw !== 'number' || !Number.isFinite(raw)) return { error: 'Enter a number.' }
  if (raw < 0) return { error: 'Use a number that is zero or more.' }
  if (raw > 1_000_000_000) return { error: 'That number is too large.' }
  if (unit === 'count') {
    if (!Number.isInteger(raw)) return { error: 'Use a whole number.' }
    return raw
  }
  if (unit === 'percent') {
    if (raw > 100) return { error: 'Use a percent from 0 to 100.' }
    return Math.round(raw * 10) / 10
  }
  if (unit === 'currency') return Math.round(raw * 100) / 100
  return Math.round(raw * 10000) / 10000
}

export function entryDateError(date: string, today: string): string | null {
  if (!isValidYmd(date)) return 'That date is not valid.'
  if (compareYmd(date, today) > 0) return 'You can log today or a past day.'
  if (compareYmd(date, shiftYmd(today, -365 * 5)) < 0) return 'Pick a date from the last five years.'
  return null
}

export function storageDateFor(definition: Pick<KpiDefinition, 'frequency'>, date: string): string {
  return definition.frequency === 'weekly' ? weekStartMonday(date) : date
}

export function customDefinition(input: CustomKpiInput, sortOrder: number): Omit<KpiDefinition, 'id'> | { error: string } {
  const name = cleanName(input.name)
  if (!name) return { error: 'Give the measure a name, up to 48 characters.' }
  if (!UNITS.has(input.unit)) return { error: 'Choose what kind of number this is.' }
  if (input.frequency !== 'daily' && input.frequency !== 'weekly') return { error: 'Choose how often you will enter it.' }
  if (input.direction !== 'higher' && input.direction !== 'lower') return { error: 'Choose whether higher or lower is better.' }
  let goalValue: number | null = null
  let goalPeriod: GoalPeriod | null = null
  if (input.goalValue != null) {
    const parsed = parseEntryValue(input.goalValue, input.unit)
    if (parsed && typeof parsed === 'object' && 'error' in parsed) return parsed
    goalValue = parsed
    goalPeriod = input.goalPeriod && PERIODS.has(input.goalPeriod)
      ? input.goalPeriod
      : (input.frequency === 'weekly' ? 'weekly' : 'daily')
    if (input.unit === 'percent') goalPeriod = null
  }
  return {
    slug: '',
    name,
    description: 'A measure you added.',
    kind: 'entered',
    unit: input.unit,
    frequency: input.frequency,
    direction: input.direction,
    aggregation: aggregationForUnit(input.unit),
    formula: null,
    formulaText: null,
    enabled: true,
    sortOrder,
    goalValue,
    goalPeriod,
    isCustom: true,
  }
}

export function isMissingTable(error: { code?: string; message?: string } | null | undefined): boolean {
  if (!error) return false
  if (error.code === '42P01' || error.code === 'PGRST205') return true
  const message = error.message || ''
  return /kpi_definitions|kpi_values/i.test(message) && /does not exist|schema cache|could not find/i.test(message)
}

export function swapSortOrder(
  definitions: KpiDefinition[],
  id: string,
  direction: 'up' | 'down',
): { id: string; sortOrder: number }[] | null {
  const current = definitions.find((definition) => definition.id === id)
  if (!current) return null
  const group = definitions
    .filter((definition) => definition.enabled === current.enabled)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
  const index = group.findIndex((definition) => definition.id === id)
  const neighbor = group[index + (direction === 'up' ? -1 : 1)]
  if (!neighbor || index < 0) return null
  return [
    { id: current.id, sortOrder: neighbor.sortOrder === current.sortOrder ? current.sortOrder - (direction === 'up' ? 1 : -1) : neighbor.sortOrder },
    { id: neighbor.id, sortOrder: current.sortOrder },
  ]
}
