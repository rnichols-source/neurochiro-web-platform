export type KpiKind = 'entered' | 'calculated'
export type KpiUnit = 'count' | 'currency' | 'percent' | 'number'
export type KpiFrequency = 'daily' | 'weekly'
export type KpiDirection = 'higher' | 'lower'
export type KpiAggregation = 'sum' | 'average' | 'latest' | 'ratio'
export type GoalPeriod = 'daily' | 'weekly' | 'monthly'
export type PeriodKey = 'today' | 'wtd' | 'mtd' | 'ytd'
export type GoalStatus = 'good' | 'close' | 'behind' | 'none'

export type KpiDefinition = {
  id: string
  slug: string
  name: string
  description: string
  kind: KpiKind
  unit: KpiUnit
  frequency: KpiFrequency
  direction: KpiDirection
  aggregation: KpiAggregation
  formula: string | null
  formulaText: string | null
  enabled: boolean
  sortOrder: number
  goalValue: number | null
  goalPeriod: GoalPeriod | null
  isCustom: boolean
}

export type KpiValue = {
  definitionId: string
  date: string
  value: number
}

export type KpiWorkspace = {
  timeZone: string
  today: string
  currency: string
  valuesFrom: string
  definitions: KpiDefinition[]
  values: KpiValue[]
  loggedDates: string[]
}

export type CustomKpiInput = {
  name: string
  unit: KpiUnit
  frequency: KpiFrequency
  direction: KpiDirection
  goalValue: number | null
  goalPeriod: GoalPeriod | null
}
