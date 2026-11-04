import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import test from 'node:test'
import {
  consistency,
  evaluateFormula,
  indexBySlug,
  indexValues,
  metricValue,
  metricValueBetween,
  periodChange,
  scaledGoal,
  trendSeries,
} from './calc.ts'
import {
  clinicToday,
  countMondays,
  dayOfYear,
  periodRange,
  previousPeriodRange,
  weekStartMonday,
} from './dates.ts'
import { currencyForCountry, formatMoney } from './currency.ts'
import { DASH, formatKpiValue, snapshotFor } from './format.ts'
import { FORMULAS, LIBRARY } from './library.ts'
import { mapLegacyEntry, mapLegacyExtras, mapLegacyGoals, shouldApplyLegacyGoal } from './legacy.ts'
import type { KpiDefinition, KpiValue } from './types.ts'
import { entryDateError, isMissingTable, parseEntryValue, storageDateFor, swapSortOrder } from './validate.ts'

function define(partial: Pick<KpiDefinition, 'id' | 'slug'> & Partial<KpiDefinition>): KpiDefinition {
  const library = LIBRARY.find((item) => item.slug === partial.slug)
  if (!library) throw new Error(partial.slug)
  return { ...library, ...partial }
}

test('clinic today follows the clinic timezone, not UTC', () => {
  const sundayEveningPacific = new Date('2026-11-02T06:30:00.000Z')
  assert.equal(clinicToday('America/Los_Angeles', sundayEveningPacific), '2026-11-01')
  assert.equal(clinicToday('UTC', sundayEveningPacific), '2026-11-02')

  const monthBoundary = new Date('2026-03-01T05:30:00.000Z')
  assert.equal(clinicToday('America/Chicago', monthBoundary), '2026-02-28')
  assert.equal(clinicToday('UTC', monthBoundary), '2026-03-01')

  const yearBoundary = new Date('2026-01-01T07:30:00.000Z')
  assert.equal(clinicToday('America/Los_Angeles', yearBoundary), '2025-12-31')
  assert.equal(clinicToday('Not/AZone', yearBoundary), null)
})

test('weeks start Monday and do not shift across UTC', () => {
  assert.equal(weekStartMonday('2026-11-01'), '2026-10-26')
  assert.equal(weekStartMonday('2026-11-02'), '2026-11-02')
  assert.equal(weekStartMonday('2026-11-04'), '2026-11-02')
  assert.deepEqual(periodRange('wtd', '2026-11-01'), { start: '2026-10-26', end: '2026-11-01' })
  assert.deepEqual(periodRange('mtd', '2026-11-04'), { start: '2026-11-01', end: '2026-11-04' })
  assert.deepEqual(periodRange('ytd', '2026-11-04'), { start: '2026-01-01', end: '2026-11-04' })
})

test('previous periods clamp to real month and year ends', () => {
  assert.deepEqual(previousPeriodRange('today', '2026-11-04'), { start: '2026-11-03', end: '2026-11-03' })
  assert.deepEqual(previousPeriodRange('wtd', '2026-11-04'), { start: '2026-10-26', end: '2026-10-28' })
  assert.deepEqual(previousPeriodRange('wtd', '2026-11-01'), { start: '2026-10-19', end: '2026-10-25' })
  assert.deepEqual(previousPeriodRange('mtd', '2026-03-31'), { start: '2026-02-01', end: '2026-02-28' })
  assert.deepEqual(previousPeriodRange('mtd', '2024-03-31'), { start: '2024-02-01', end: '2024-02-29' })
  assert.deepEqual(previousPeriodRange('ytd', '2024-02-29'), { start: '2023-01-01', end: '2023-02-28' })
  assert.equal(dayOfYear('2026-01-10'), 10)
  assert.equal(dayOfYear('2024-03-01'), 61)
  assert.equal(countMondays('2026-11-01', '2026-11-04'), 1)
  assert.equal(countMondays('2026-11-01', '2026-11-30'), 5)
})

test('divide by zero is a dash, and a real zero stays a zero', () => {
  assert.equal(evaluateFormula('pva', (slug) => (slug === 'patient_visits' ? 40 : 0)), null)
  assert.equal(evaluateFormula('no_show_rate', () => 0), null)
  assert.equal(evaluateFormula('case_acceptance_rate', (slug) => (slug === 'new_patient_exams' ? 0 : 4)), null)
  assert.equal(evaluateFormula('collection_rate', (slug) => (slug === 'collections' ? 100 : null)), null)
  assert.equal(formatKpiValue(null, 'percent'), DASH)
  assert.equal(formatKpiValue(0, 'percent'), '0%')
  assert.notEqual(formatKpiValue(null, 'percent'), '0%')

  const rate = evaluateFormula('no_show_rate', (slug) => {
    if (slug === 'no_shows') return 2
    if (slug === 'patient_visits') return 18
    if (slug === 'cancellations') return 0
    return null
  })
  assert.equal(rate, 10)
  assert.equal(formatKpiValue(rate, 'percent'), '10%')
})

test('missing pieces do not invent a rate, and a typed zero does', () => {
  assert.equal(evaluateFormula('pva', () => null), null)
  assert.equal(evaluateFormula('collections_per_visit', (slug) => (slug === 'collections' ? 2800 : 40)), 70)
  assert.equal(evaluateFormula('case_acceptance_rate', (slug) => (slug === 'care_plans_accepted' ? 7 : 10)), 70)
  assert.equal(evaluateFormula('neurochiro_lead_share', (slug) => (slug === 'neurochiro_leads' ? 2 : 0)), null)
  assert.equal(evaluateFormula('drop_off_rate', (slug) => (slug === 'dropped_off' ? 2 : slug === 'active_patients' ? 150 : null)), (2 / 152) * 100)
})

test('period math uses sums for visits and ratios for rates', () => {
  const definitions = [
    define({ id: 'visits', slug: 'patient_visits' }),
    define({ id: 'new', slug: 'new_patients' }),
    define({ id: 'pva', slug: 'pva' }),
    define({ id: 'noshow', slug: 'no_shows' }),
    define({ id: 'cancel', slug: 'cancellations' }),
    define({ id: 'rate', slug: 'no_show_rate' }),
    define({ id: 'active', slug: 'active_patients' }),
    define({ id: 'reviews', slug: 'google_reviews' }),
  ]
  const bySlug = indexBySlug(definitions)
  const values: KpiValue[] = [
    { definitionId: 'visits', date: '2026-11-02', value: 40 },
    { definitionId: 'visits', date: '2026-11-03', value: 0 },
    { definitionId: 'visits', date: '2026-11-04', value: 10 },
    { definitionId: 'new', date: '2026-11-02', value: 2 },
    { definitionId: 'new', date: '2026-11-04', value: 0 },
    { definitionId: 'noshow', date: '2026-11-04', value: 1 },
    { definitionId: 'cancel', date: '2026-11-04', value: 1 },
    { definitionId: 'active', date: '2026-10-26', value: 140 },
    { definitionId: 'active', date: '2026-11-02', value: 150 },
    { definitionId: 'reviews', date: '2026-10-26', value: 5 },
    { definitionId: 'reviews', date: '2026-11-02', value: 1 },
  ]
  const indexed = indexValues(values)
  const today = '2026-11-04'

  assert.equal(metricValue(bySlug.get('patient_visits')!, bySlug, indexed, 'today', today), 10)
  assert.equal(metricValue(bySlug.get('patient_visits')!, bySlug, indexed, 'wtd', today), 50)
  assert.equal(metricValue(bySlug.get('pva')!, bySlug, indexed, 'wtd', today), 25)
  assert.equal(metricValue(bySlug.get('pva')!, bySlug, indexed, 'today', today), null)
  assert.equal(metricValue(bySlug.get('no_show_rate')!, bySlug, indexed, 'today', today), (1 / 12) * 100)
  assert.equal(metricValue(bySlug.get('active_patients')!, bySlug, indexed, 'mtd', today), 150)
  assert.equal(metricValue(bySlug.get('google_reviews')!, bySlug, indexed, 'today', today), 1)
  assert.equal(metricValue(bySlug.get('google_reviews')!, bySlug, indexed, 'mtd', today), 1)
  assert.equal(metricValueBetween(bySlug.get('google_reviews')!, bySlug, indexed, '2026-10-26', '2026-11-01'), 5)
})

test('an empty stretch is not zero, and a saved zero is zero', () => {
  const visits = define({ id: 'visits', slug: 'patient_visits' })
  const bySlug = indexBySlug([visits])
  assert.equal(metricValue(visits, bySlug, indexValues([]), 'today', '2026-11-04'), null)
  assert.equal(metricValue(visits, bySlug, indexValues([{ definitionId: 'visits', date: '2026-11-04', value: 0 }]), 'today', '2026-11-04'), 0)
})

test('goals scale for counts and stay put for rates', () => {
  const visits = define({ id: 'visits', slug: 'patient_visits' })
  const acceptance = define({ id: 'accept', slug: 'case_acceptance_rate' })
  const reviews = define({ id: 'reviews', slug: 'google_reviews' })
  const active = define({ id: 'active', slug: 'active_patients' })
  const bySlug = indexBySlug([visits, acceptance, reviews, active])
  const today = '2026-11-04'

  assert.equal(scaledGoal(visits, 'today', today, bySlug), 40)
  assert.equal(scaledGoal(visits, 'wtd', today, bySlug), 120)
  assert.equal(scaledGoal(visits, 'mtd', today, bySlug), 160)
  assert.equal(scaledGoal(visits, 'ytd', '2026-01-10', bySlug), 400)
  assert.equal(scaledGoal(acceptance, 'today', today, bySlug), 70)
  assert.equal(scaledGoal(acceptance, 'ytd', today, bySlug), 70)
  assert.equal(scaledGoal(reviews, 'today', today, bySlug), 2)
  assert.equal(scaledGoal(reviews, 'wtd', '2026-11-02', bySlug), 2)
  assert.equal(scaledGoal(active, 'mtd', today, bySlug), 150)
})

test('comparison percent is blank when the last period was zero', () => {
  assert.deepEqual(periodChange(5, 0), { delta: 5, percent: null })
  assert.deepEqual(periodChange(0, 0), { delta: 0, percent: null })
  assert.deepEqual(periodChange(null, 10), { delta: null, percent: null })
  assert.equal(periodChange(12, 10).percent, 20)

  const visits = define({ id: 'visits', slug: 'patient_visits' })
  const bySlug = indexBySlug([visits])
  const indexed = indexValues([
    { definitionId: 'visits', date: '2026-11-04', value: 5 },
    { definitionId: 'visits', date: '2026-11-03', value: 0 },
  ])
  const snap = snapshotFor(visits, bySlug, indexed, 'today', '2026-11-04', 'USD')
  assert.equal(snap.percent, null)
  assert.equal(snap.comparison?.text, '5 more than yesterday')
  assert.doesNotMatch(snap.comparison?.text || '', /0%/)
})

test('streak counts clinic days and skips a missed day', () => {
  const open = consistency(['2026-11-01', '2026-11-02', '2026-11-03'], '2026-11-04')
  assert.equal(open.current, 3)
  assert.equal(open.longest, 3)
  const closed = consistency(['2026-11-02', '2026-11-04'], '2026-11-04')
  assert.equal(closed.current, 1)
  assert.equal(closed.longest, 1)
  const week = consistency(['2026-10-29', '2026-10-30', '2026-11-01', '2026-11-02', '2026-11-04'], '2026-11-04')
  assert.equal(week.last7, 5)
})

test('weekly numbers are stored on Monday', () => {
  assert.equal(storageDateFor({ frequency: 'weekly' }, '2026-11-04'), '2026-11-02')
  assert.equal(storageDateFor({ frequency: 'daily' }, '2026-11-04'), '2026-11-04')
  assert.equal(entryDateError('2026-11-05', '2026-11-04'), 'You can log today or a past day.')
  assert.equal(entryDateError('2026-02-31', '2026-11-04'), 'That date is not valid.')
})

test('old scorecard rows keep visits and convert collections from cents', () => {
  const points = mapLegacyEntry({
    date: '2026-10-02',
    patient_visits: 40,
    new_patients: 0,
    collections: 280000,
    no_shows: 2,
    energy_level: 0,
  })
  assert.deepEqual(points.map((point) => [point.slug, point.value]), [
    ['patient_visits', 40],
    ['new_patients', 0],
    ['no_shows', 2],
    ['collections', 2800],
  ])
  const withEnergy = mapLegacyEntry({
    date: '2026-10-03',
    patient_visits: 1,
    new_patients: 1,
    collections: 100,
    no_shows: 0,
    energy_level: 4,
  })
  assert.equal(withEnergy.find((point) => point.slug === 'energy')?.value, 4)
  assert.equal(withEnergy.find((point) => point.slug === 'collections')?.value, 1)
})

test('a changed goal is kept when older saved goals are read', () => {
  assert.equal(shouldApplyLegacyGoal(40, 40, 30), true)
  assert.equal(shouldApplyLegacyGoal(25, 40, 30), false)
  assert.equal(shouldApplyLegacyGoal(2800, 2800, 1500), true)
})

test('saved goals and the last extra numbers map onto the new list', () => {
  assert.deepEqual(mapLegacyGoals({ visits: 30, newPatients: 1, collections: 150000, noShows: 1, referrals: 2 }), [
    { slug: 'patient_visits', goalValue: 30, goalPeriod: 'daily' },
    { slug: 'new_patients', goalValue: 1, goalPeriod: 'daily' },
    { slug: 'collections', goalValue: 1500, goalPeriod: 'daily' },
    { slug: 'no_shows', goalValue: 1, goalPeriod: 'daily' },
    { slug: 'referrals', goalValue: 2, goalPeriod: 'daily' },
  ])
  const extras = mapLegacyExtras({
    referrals: '3',
    reactivations: '1',
    caseAcceptance: '80',
    servicesPerVisit: '2.5',
    date: '2026-10-02',
  })
  assert.equal(extras.points.find((point) => point.slug === 'legacy_case_acceptance')?.value, 80)
  assert.equal(extras.definitions.length, 2)
  assert.equal(mapLegacyExtras({ date: 'not-a-date', referrals: '1' }).points.length, 0)
})

test('currency follows the clinic country', () => {
  assert.equal(currencyForCountry('US'), 'USD')
  assert.equal(currencyForCountry('Australia'), 'AUD')
  assert.equal(currencyForCountry('United Kingdom'), 'GBP')
  assert.equal(currencyForCountry('Canada'), 'CAD')
  assert.equal(currencyForCountry('India'), 'INR')
  assert.equal(currencyForCountry(''), 'USD')
  assert.match(formatMoney(2800, 'USD'), /\$2,800/)
  assert.match(formatMoney(70.5, 'GBP'), /£70\.50|GBP/)
  assert.match(formatMoney(10, 'AUD'), /A\$|AUD/)
})

test('library formulas point at measures that exist', () => {
  const slugs = new Set(LIBRARY.map((item) => item.slug))
  assert.equal(slugs.size, LIBRARY.length)
  for (const item of LIBRARY) {
    if (item.kind !== 'calculated' || !item.formula) continue
    const spec = FORMULAS[item.formula]
    assert.ok(spec, item.slug)
    assert.equal(item.formulaText, spec.text)
    for (const slug of [...spec.numerator, ...spec.denominator]) {
      const source = LIBRARY.find((candidate) => candidate.slug === slug)
      assert.equal(source?.kind, 'entered', slug)
    }
  }
})

test('hiding order swaps with the neighbor and does not drop a row', () => {
  const definitions = [
    define({ id: 'a', slug: 'patient_visits', sortOrder: 10, enabled: true }),
    define({ id: 'b', slug: 'new_patients', sortOrder: 20, enabled: true }),
    define({ id: 'c', slug: 'collections', sortOrder: 30, enabled: false }),
  ]
  const swapped = swapSortOrder(definitions, 'b', 'up')
  assert.deepEqual(swapped, [
    { id: 'b', sortOrder: 10 },
    { id: 'a', sortOrder: 20 },
  ])
  assert.equal(swapSortOrder(definitions, 'a', 'up'), null)
  assert.equal(parseEntryValue(null, 'count'), null)
  assert.equal(parseEntryValue(1.5, 'count') && 'error' in (parseEntryValue(1.5, 'count') as object), true)
})

test('trend buckets stop at today', () => {
  const visits = define({ id: 'visits', slug: 'patient_visits' })
  const bySlug = indexBySlug([visits])
  const indexed = indexValues([{ definitionId: 'visits', date: '2026-11-04', value: 8 }])
  const trend = trendSeries(visits, bySlug, indexed, '2026-11-04')
  assert.equal(trend.length, 14)
  assert.equal(trend[trend.length - 1].value, 8)
  assert.equal(trend[0].value, null)
})

test('scorecard code does not import the admin client or use local storage', () => {
  const roots = [
    path.join(process.cwd(), 'src/lib/kpi'),
    path.join(process.cwd(), 'src/app/(doctor)/doctor/kpi'),
  ]
  const files: string[] = []
  for (const root of roots) {
    for (const name of readdirSync(root)) {
      if ((name.endsWith('.ts') || name.endsWith('.tsx')) && !name.endsWith('.test.ts')) files.push(path.join(root, name))
    }
  }
  assert.ok(files.length > 5)
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    assert.equal(text.includes('supabase-admin'), false, file)
    assert.equal(text.includes('localStorage'), false, file)
    assert.equal(text.includes('service_role'), false, file)
  }
})

test('the proposed SQL is marked for Raymond and lists every starting measure', () => {
  const sql = readFileSync('supabase/migrations/proposed/20261111120000_kpi_tracker.sql', 'utf8')
  assert.equal(sql.startsWith('-- NOT RUN — Raymond reviews and runs\n'), true)
  for (const item of LIBRARY) assert.equal(sql.includes(`'${item.slug}'`), true, item.slug)
  assert.equal(sql.includes('kpi_v2_imported'), true)
  assert.equal(sql.includes('/ 100'), true)
})

test('a missing scorecard table is recognizable', () => {
  assert.equal(isMissingTable({ code: '42P01', message: 'relation kpi_definitions does not exist' }), true)
  assert.equal(isMissingTable({ code: 'PGRST205', message: 'Could not find the table kpi_values in the schema cache' }), true)
  assert.equal(isMissingTable({ message: 'permission denied' }), false)
})
