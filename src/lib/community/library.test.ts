import assert from 'node:assert/strict'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { libraryPlans, remedyGuide } from './library-content.ts'
import {
  CATEGORY_LABELS,
  LIBRARY_COPY,
  OMITTED_STUBS,
  careHomeLine,
  categoriesInUse,
  chromeBlob,
  countDone,
  exerciseCount,
  favoriteCards,
  filterSummaries,
  forbiddenPhrase,
  guideBlob,
  isAssignableSlug,
  kidsStopCell,
  librarySummaries,
  memberAssignmentRank,
  parseDoctorNote,
  parseIllnessNote,
  planBySlug,
  plansVisibleToMember,
  presentedPlanBlob,
  remediesForSymptoms,
  searchRemedyCards,
  slugsForMember,
} from './library-model.ts'
import { PUBLIC_ORIGIN } from './phases.ts'

const here = dirname(fileURLToPath(import.meta.url))

function filesUnder(dir: string): string[] {
  const found: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) found.push(...filesUnder(full))
    else if (/\.(ts|tsx)$/.test(entry)) found.push(full)
  }
  return found
}

test('the exercise library is the 28 complete plans, verbatim, without the 14 stubs', () => {
  const raw = JSON.parse(readFileSync(join(here, 'library/plans.json'), 'utf8')) as {
    plans: { id: string; name: string; objective: string; phases: { name: string; goal: string; exercises: { name: string; rx: string; description: string }[] }[] }[]
  }
  const plans = libraryPlans()
  assert.equal(plans.length, 28)
  assert.equal(exerciseCount(plans), 423)
  assert.equal(categoriesInUse(plans).includes('recovery'), false)
  for (const stub of OMITTED_STUBS) {
    assert.equal(plans.some((plan) => plan.slug === stub), false)
    assert.equal(isAssignableSlug(plans, stub), false)
  }
  assert.equal(isAssignableSlug(plans, 'si-joint'), true)
  for (const source of raw.plans) {
    const plan = planBySlug(plans, source.id)
    assert.ok(plan)
    assert.equal(plan.name, source.name)
    assert.equal(plan.objective, source.objective)
    source.phases.forEach((phase, phaseIndex) => {
      assert.equal(plan.phases[phaseIndex].name, phase.name)
      assert.equal(plan.phases[phaseIndex].goal, phase.goal)
      phase.exercises.forEach((exercise, exerciseIndex) => {
        const shown = plan.phases[phaseIndex].exercises[exerciseIndex]
        assert.equal(shown.name, exercise.name)
        assert.equal(shown.rx, exercise.rx)
        assert.equal(shown.description, exercise.description)
      })
    })
  }
  const si = planBySlug(plans, 'si-joint')
  assert.ok(si)
  assert.equal(si.phases[0].exercises[0].name, 'Supine 90-90 Decompression')
  assert.equal(si.phases[0].exercises[0].rx, '3 minutes')
  assert.match(si.phases[0].exercises[0].description, /^Lie flat on your back with your lower legs supported on a chair or bench\./)
})

test('clinic branding is removed from what a community member reads', () => {
  const raw = readFileSync(join(here, 'library/plans.json'), 'utf8')
  assert.match(raw, /Bring your shoes to Dr\. Ray for a wear-pattern check/)
  assert.match(raw, /talk to Dr\. Ray before starting cold exposure/)
  const shown = presentedPlanBlob(libraryPlans())
  assert.equal(forbiddenPhrase(shown), null)
  assert.match(shown, /Bring your shoes to your NeuroChiro doctor for a wear-pattern check/)
  assert.match(shown, /Raynaud's/)
  assert.match(shown, /talk to your NeuroChiro doctor before starting cold exposure/)
  assert.equal(forbiddenPhrase(guideBlob(remedyGuide())), null)
  assert.equal(forbiddenPhrase(chromeBlob()), null)
  assert.doesNotMatch(chromeBlob(), /\bpatient\b/i)
  assert.equal(PUBLIC_ORIGIN, 'https://neurochiro.co')
})

test('a community member only sees exercise plans assigned to them', () => {
  const plans = libraryPlans()
  const rows = [
    { profileId: 'member-a', slug: 'si-joint' },
    { profileId: 'member-b', slug: 'neck-pain' },
    { profileId: 'member-a', slug: null },
  ]
  const mine = slugsForMember(rows, 'member-a')
  assert.deepEqual(mine, ['si-joint'])
  const visible = plansVisibleToMember(plans, mine)
  assert.equal(visible.length, 1)
  assert.equal(visible[0].name, 'SI Joint Stability & Pelvic Rebalancing')
  assert.equal(plansVisibleToMember(plans, slugsForMember(rows, 'member-b'))[0].slug, 'neck-pain')
  assert.equal(plansVisibleToMember(plans, slugsForMember(rows, 'someone-else')).length, 0)
  assert.equal(plansVisibleToMember(plans, []).length, 0)
  assert.equal(memberAssignmentRank('library') < memberAssignmentRank('custom'), true)
  assert.equal(memberAssignmentRank('custom') < memberAssignmentRank('sample'), true)
  const progress = countDone(['si-joint:0:0', 'si-joint:0:1'], new Set(['si-joint:0:0']))
  assert.deepEqual(progress, { finished: 1, total: 2 })
  assert.equal(careHomeLine([]), 'The family remedy guide is in Care.')
  assert.match(careHomeLine(['SI Joint Stability & Pelvic Rebalancing']), /SI Joint Stability & Pelvic Rebalancing is assigned/)
  assert.match(careHomeLine(['One', 'Two']), /^2 exercise plans are assigned/)
  assert.doesNotMatch(careHomeLine(['One', 'Two']), /One/)
  const hip = filterSummaries(librarySummaries(plans), 'hip', 'pelvic')
  assert.equal(hip.some((plan) => plan.slug === 'si-joint'), true)
  assert.equal(hip.some((plan) => plan.category !== 'hip'), false)
  assert.equal(CATEGORY_LABELS.hip, 'Hip')
})

test('the remedy guide keeps original cards, symptom words, shopping, protocols, and the kids table', () => {
  const guide = remedyGuide()
  assert.equal(guide.calculator, 'excluded')
  const throat = guide.sections.find((section) => section.id === 'sore-throat')
  assert.ok(throat)
  const salt = throat.cards.find((card) => card.name === 'Salt Water Gargle')
  assert.ok(salt)
  const steps = salt.blocks.find((block) => block.type === 'steps')
  assert.ok(steps && steps.type === 'steps')
  assert.deepEqual(steps.items, [
    'Heat water until warm (microwave 45 seconds or stovetop).',
    'Add salt and stir until completely dissolved.',
    'Take a big sip, tilt head back, and gargle for 30 full seconds. Really let it reach the back of your throat.',
    'Spit it out. Do NOT swallow.',
    'Repeat until the glass is empty (about 3-4 gargles).',
  ])
  const sore = guide.symptoms.find((symptom) => symptom.label === 'Sore Throat')
  assert.deepEqual(sore?.keywords, ['sore', 'throat'])
  assert.equal(guide.symptoms.some((symptom) => /lumbar disc/i.test(symptom.label)), false)
  const hits = remediesForSymptoms(guide, ['Sore Throat'])
  assert.equal(hits.some((hit) => hit.name === 'Salt Water Gargle' && hit.sectionId === 'sore-throat'), true)
  const found = searchRemedyCards(guide, 'salt water gargle')
  assert.equal(found[0]?.name, 'Salt Water Gargle')
  assert.equal(found[0]?.sectionId, 'sore-throat')
  const protocols = guide.sections.find((section) => section.id === 'protocols')
  assert.deepEqual(protocols?.cards.map((card) => card.name), [
    'Day 1-2: The All-Out Attack',
    'Day 3-5: Recovery Mode',
    'Prevention Protocol (Daily, When Healthy)',
  ])
  const levels = guide.sections.find((section) => section.id === 'my-protocol')
  assert.equal(levels?.cards.some((card) => card.name.startsWith('Level 1:')), true)
  assert.equal(levels?.cards.some((card) => card.name.startsWith('Level 3:')), true)
  const kids = guide.sections.find((section) => section.id === 'kids')
  assert.equal(kids?.kidsTable?.rows[0].remedy, 'Honey')
  assert.deepEqual(kids?.kidsTable?.rows[0].cells, ['NEVER', '1/2 tsp', '1 tsp', '2 tsp'])
  assert.equal(kidsStopCell('NEVER'), true)
  assert.equal(kidsStopCell('NO'), true)
  assert.equal(kidsStopCell('1 tsp'), false)
  assert.match(guide.shopping.categories[0].items[0].label, /Elderberry syrup/)
  assert.equal(guide.emergency.some((contact) => contact.phone === '1-800-222-1222'), true)
  const saved = favoriteCards(guide, new Set([salt.key]))
  assert.equal(saved.length, 1)
  assert.equal(saved[0].name, 'Salt Water Gargle')
})

test('the medication calculator is not part of the guide or the new screens', () => {
  const guideFile = readFileSync(join(here, 'library/guide.json'), 'utf8')
  assert.doesNotMatch(guideFile, /doseWeight|Kid Dosage Calculator|0\.453592|doseCalc/)
  assert.match(guideFile, /"calculator":"excluded"/)
  const roots = [
    join(here, '../../components/community/library-plan-board.tsx'),
    join(here, '../../components/community/favorite-button.tsx'),
    join(here, '../../components/community/remedy-card.tsx'),
    join(here, '../../components/community/shopping-list.tsx'),
    join(here, '../../components/community/illness-note.tsx'),
    join(here, '../../components/community/home-view.tsx'),
    join(here, '../../components/community/exercise-board.tsx'),
    join(here, '../../app/(portal)/portal/care/remedies'),
    join(here, '../../app/(portal)/portal/care/exercises/page.tsx'),
    join(here, '../../app/(portal)/portal/care/page.tsx'),
    join(here, '../../app/(portal)/portal/week/page.tsx'),
    join(here, '../../app/(doctor)/doctor/care-sets'),
  ]
  const files = roots.flatMap((path) => (statSync(path).isDirectory() ? filesUnder(path) : [path]))
  const blob = files.map((file) => readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(blob, /doseWeight|Kid Dosage Calculator|0\.453592|doseCalc|Inter\(/)
  assert.doesNotMatch(blob, /\bpatient\b/i)
  assert.doesNotMatch(blob, /AlignLife|864-605-7544|PelhamFalls|Ask Dr\. Ray/)
})

test('library account rows are owner-scoped and the catalog is not a public list', () => {
  const sql = readFileSync(join(here, '../../../supabase/migrations/20261114010000_community_care_library.sql'), 'utf8')
  assert.match(sql, /^begin;/m)
  assert.match(sql, /commit;\s*$/)
  for (const table of [
    'community_library_plans',
    'community_library_exercise_done',
    'community_remedy_favorites',
    'community_shopping_checks',
    'community_illness_notes',
  ]) {
    assert.match(sql, new RegExp(`alter table public\\.${table} enable row level security`))
    assert.match(sql, new RegExp(`revoke all on table public\\.${table} from public, anon`))
    assert.doesNotMatch(sql, new RegExp(`grant .+ on table public\\.${table} to anon`))
  }
  assert.match(sql, /grant select on table public\.community_library_plans to authenticated/)
  assert.match(sql, /on conflict \(slug\) do nothing/)
  assert.match(sql, /'si-joint'/)
  assert.doesNotMatch(sql, /sciatica/)
  assert.match(sql, /library_plan_slug is null/)
  assert.match(sql, /using \(profile_id = auth\.uid\(\)\)/)
  assert.match(sql, /exists \(select 1 from public\.doctors where user_id = auth\.uid\(\)\)/)
  assert.doesNotMatch(sql, /using \(true\)/)
  assert.doesNotMatch(sql, /alter table public\.profiles/)
  const catalogPolicy = sql.slice(
    sql.indexOf('create policy community_library_plans_doctor_select'),
    sql.indexOf('drop policy if exists community_assignments_owner_all'),
  )
  assert.match(catalogPolicy, /for select/)
  assert.doesNotMatch(catalogPolicy, /for insert|for all|for update/)
  const note = parseDoctorNote('As we discussed.')
  assert.deepEqual(note, { note: 'As we discussed.' })
  const branded = parseDoctorNote('Call 864-605-7544 at AlignLife')
  assert.equal('error' in branded, true)
  const illness = parseIllnessNote('2026-11-13', '', '2026-11-13')
  assert.deepEqual(illness, { startedOn: '2026-11-13', note: null })
  assert.equal('error' in parseIllnessNote('2026-11-14', '', '2026-11-13'), true)
  assert.match(LIBRARY_COPY.kidsNote, /does not calculate a dose/)
})
