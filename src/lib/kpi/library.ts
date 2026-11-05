import type { KpiAggregation, KpiDefinition, KpiDirection, KpiFrequency, KpiKind, KpiUnit, GoalPeriod } from './types.ts'

export type LibraryKpi = Omit<KpiDefinition, 'id'>

export type FormulaSpec = {
  id: string
  text: string
  numerator: string[]
  denominator: string[]
  scale: number
}

export const FORMULAS: Record<string, FormulaSpec> = {
  pva: {
    id: 'pva',
    text: 'Patient visits divided by new patients, for the period you are looking at.',
    numerator: ['patient_visits'],
    denominator: ['new_patients'],
    scale: 1,
  },
  collections_per_visit: {
    id: 'collections_per_visit',
    text: 'Collections divided by patient visits.',
    numerator: ['collections'],
    denominator: ['patient_visits'],
    scale: 1,
  },
  case_acceptance_rate: {
    id: 'case_acceptance_rate',
    text: 'Care plans accepted divided by new patient exams, shown as a percent.',
    numerator: ['care_plans_accepted'],
    denominator: ['new_patient_exams'],
    scale: 100,
  },
  no_show_rate: {
    id: 'no_show_rate',
    text: 'No-shows divided by visits plus no-shows plus cancellations, shown as a percent.',
    numerator: ['no_shows'],
    denominator: ['patient_visits', 'no_shows', 'cancellations'],
    scale: 100,
  },
  cancellation_rate: {
    id: 'cancellation_rate',
    text: 'Cancellations divided by visits plus no-shows plus cancellations, shown as a percent.',
    numerator: ['cancellations'],
    denominator: ['patient_visits', 'no_shows', 'cancellations'],
    scale: 100,
  },
  collection_rate: {
    id: 'collection_rate',
    text: 'Collections divided by charges billed, shown as a percent.',
    numerator: ['collections'],
    denominator: ['charges'],
    scale: 100,
  },
  drop_off_rate: {
    id: 'drop_off_rate',
    text: 'Patients who stopped care divided by patients still active plus patients who stopped, shown as a percent.',
    numerator: ['dropped_off'],
    denominator: ['active_patients', 'dropped_off'],
    scale: 100,
  },
  neurochiro_lead_share: {
    id: 'neurochiro_lead_share',
    text: 'NeuroChiro leads divided by all new leads, shown as a percent.',
    numerator: ['neurochiro_leads'],
    denominator: ['leads'],
    scale: 100,
  },
}

function entered(input: {
  slug: string
  name: string
  description: string
  unit: KpiUnit
  frequency: KpiFrequency
  direction: KpiDirection
  aggregation: KpiAggregation
  sortOrder: number
  goalValue: number | null
  goalPeriod: GoalPeriod | null
  enabled?: boolean
}): LibraryKpi {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    kind: 'entered',
    unit: input.unit,
    frequency: input.frequency,
    direction: input.direction,
    aggregation: input.aggregation,
    formula: null,
    formulaText: null,
    enabled: input.enabled ?? true,
    sortOrder: input.sortOrder,
    goalValue: input.goalValue,
    goalPeriod: input.goalPeriod,
    isCustom: false,
  }
}

function calculated(input: {
  slug: string
  name: string
  formula: string
  unit: KpiUnit
  direction: KpiDirection
  sortOrder: number
  goalValue: number | null
  frequency?: KpiFrequency
}): LibraryKpi {
  const spec = FORMULAS[input.formula]
  return {
    slug: input.slug,
    name: input.name,
    description: spec.text,
    kind: 'calculated' satisfies KpiKind,
    unit: input.unit,
    frequency: input.frequency ?? 'daily',
    direction: input.direction,
    aggregation: 'ratio',
    formula: input.formula,
    formulaText: spec.text,
    enabled: true,
    sortOrder: input.sortOrder,
    goalValue: input.goalValue,
    goalPeriod: null,
    isCustom: false,
  }
}

/** Starting scorecard. Goals are a place to begin; each office should change them. */
export const LIBRARY: LibraryKpi[] = [
  entered({
    slug: 'patient_visits',
    name: 'Patient visits',
    description: 'How many patient visits the office saw.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 10,
    goalValue: 40,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'new_patients',
    name: 'New patients',
    description: 'People who came in as new patients.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 20,
    goalValue: 2,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'new_patient_exams',
    name: 'New patient exams',
    description: 'New-patient exams or consults.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 30,
    goalValue: 2,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'care_plans_accepted',
    name: 'Care plans accepted',
    description: 'Care plans (cases) the patient agreed to start.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 40,
    goalValue: 1,
    goalPeriod: 'daily',
  }),
  calculated({
    slug: 'pva',
    name: 'Patient visit average',
    formula: 'pva',
    unit: 'number',
    direction: 'higher',
    sortOrder: 45,
    goalValue: 12,
  }),
  calculated({
    slug: 'case_acceptance_rate',
    name: 'Care plan acceptance',
    formula: 'case_acceptance_rate',
    unit: 'percent',
    direction: 'higher',
    sortOrder: 50,
    goalValue: 70,
  }),
  entered({
    slug: 'reactivations',
    name: 'Reactivations',
    description: 'Past patients who started care again.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 60,
    goalValue: 1,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'cancellations',
    name: 'Cancellations',
    description: 'Visits that were cancelled.',
    unit: 'count',
    frequency: 'daily',
    direction: 'lower',
    aggregation: 'sum',
    sortOrder: 70,
    goalValue: 2,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'no_shows',
    name: 'No-shows',
    description: 'Visits where the patient did not come and did not cancel.',
    unit: 'count',
    frequency: 'daily',
    direction: 'lower',
    aggregation: 'sum',
    sortOrder: 80,
    goalValue: 2,
    goalPeriod: 'daily',
  }),
  calculated({
    slug: 'cancellation_rate',
    name: 'Cancellation rate',
    formula: 'cancellation_rate',
    unit: 'percent',
    direction: 'lower',
    sortOrder: 85,
    goalValue: 10,
  }),
  calculated({
    slug: 'no_show_rate',
    name: 'No-show rate',
    formula: 'no_show_rate',
    unit: 'percent',
    direction: 'lower',
    sortOrder: 90,
    goalValue: 10,
  }),
  entered({
    slug: 'collections',
    name: 'Collections',
    description: 'Money collected.',
    unit: 'currency',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 100,
    goalValue: 2800,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'charges',
    name: 'Charges billed',
    description: 'Services billed, before you count what was collected.',
    unit: 'currency',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 110,
    goalValue: 3000,
    goalPeriod: 'daily',
  }),
  calculated({
    slug: 'collection_rate',
    name: 'Collection rate',
    formula: 'collection_rate',
    unit: 'percent',
    direction: 'higher',
    sortOrder: 115,
    goalValue: 95,
  }),
  calculated({
    slug: 'collections_per_visit',
    name: 'Collections per visit',
    formula: 'collections_per_visit',
    unit: 'currency',
    direction: 'higher',
    sortOrder: 120,
    goalValue: 70,
  }),
  entered({
    slug: 'referrals',
    name: 'Referrals',
    description: 'Patients sent by someone who already trusts the office.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 130,
    goalValue: 1,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'leads',
    name: 'New leads',
    description: 'New people who asked about care, from every source.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 140,
    goalValue: 1,
    goalPeriod: 'daily',
  }),
  entered({
    slug: 'neurochiro_leads',
    name: 'NeuroChiro leads',
    description: 'New leads that came from NeuroChiro.',
    unit: 'count',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 150,
    goalValue: 1,
    goalPeriod: 'daily',
  }),
  calculated({
    slug: 'neurochiro_lead_share',
    name: 'NeuroChiro share of leads',
    formula: 'neurochiro_lead_share',
    unit: 'percent',
    direction: 'higher',
    sortOrder: 155,
    goalValue: null,
  }),
  entered({
    slug: 'google_reviews',
    name: 'Google reviews',
    description: 'New Google reviews. Enter this once for the week.',
    unit: 'count',
    frequency: 'weekly',
    direction: 'higher',
    aggregation: 'sum',
    sortOrder: 200,
    goalValue: 2,
    goalPeriod: 'weekly',
  }),
  entered({
    slug: 'dropped_off',
    name: 'Patients who dropped off',
    description: 'Patients who stopped care. Enter this once for the week.',
    unit: 'count',
    frequency: 'weekly',
    direction: 'lower',
    aggregation: 'sum',
    sortOrder: 210,
    goalValue: 2,
    goalPeriod: 'weekly',
  }),
  entered({
    slug: 'active_patients',
    name: 'Active patients',
    description: 'Patients still under care. Enter the current count once a week.',
    unit: 'count',
    frequency: 'weekly',
    direction: 'higher',
    aggregation: 'latest',
    sortOrder: 220,
    goalValue: 150,
    goalPeriod: 'monthly',
  }),
  calculated({
    slug: 'drop_off_rate',
    name: 'Drop-off rate',
    formula: 'drop_off_rate',
    unit: 'percent',
    direction: 'lower',
    sortOrder: 225,
    goalValue: 5,
    frequency: 'weekly',
  }),
  entered({
    slug: 'energy',
    name: 'Energy',
    description: 'How the day felt, from 1 low to 5 high.',
    unit: 'number',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'average',
    sortOrder: 900,
    goalValue: null,
    goalPeriod: null,
    enabled: false,
  }),
]

export const LEGACY_EXTRAS: Record<string, LibraryKpi> = {
  legacy_case_acceptance: entered({
    slug: 'legacy_case_acceptance',
    name: 'Case acceptance (earlier entry)',
    description: 'A percent typed on the earlier scorecard. The new acceptance rate is calculated from exams and care plans, so this older number is kept separately.',
    unit: 'percent',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'average',
    sortOrder: 910,
    goalValue: null,
    goalPeriod: null,
    enabled: false,
  }),
  legacy_services_per_visit: entered({
    slug: 'legacy_services_per_visit',
    name: 'Services per visit (earlier entry)',
    description: 'A number typed on the earlier scorecard. Kept so that entry is not lost.',
    unit: 'number',
    frequency: 'daily',
    direction: 'higher',
    aggregation: 'average',
    sortOrder: 920,
    goalValue: null,
    goalPeriod: null,
    enabled: false,
  }),
}

export const IMPORT_FLAG = 'kpi_v2_imported'

export function libraryBySlug(): Map<string, LibraryKpi> {
  return new Map(LIBRARY.map((item) => [item.slug, item]))
}
