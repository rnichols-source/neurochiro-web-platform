import plansFile from './library/plans.json' with { type: 'json' }
import guideFile from './library/guide.json' with { type: 'json' }
import {
  LIBRARY_EXERCISE_COUNT,
  LIBRARY_PLAN_COUNT,
  OMITTED_STUBS,
  exerciseCount,
  presentPlans,
  type LibraryPlan,
  type RemedyGuide,
  type SourcePlan,
} from './library-model.ts'

type PlansFile = { omittedStubs: string[]; plans: SourcePlan[] }

let plansCache: LibraryPlan[] | null = null
let guideCache: RemedyGuide | null = null

export function libraryPlans(): LibraryPlan[] {
  if (plansCache) return plansCache
  const file = plansFile as PlansFile
  const omitted = new Set(file.omittedStubs)
  for (const stub of OMITTED_STUBS) {
    if (!omitted.has(stub)) throw new Error(`Missing omitted stub ${stub}`)
  }
  for (const plan of file.plans) {
    if (omitted.has(plan.id)) throw new Error(`Stub plan ${plan.id} was included`)
  }
  const plans = presentPlans(file.plans)
  if (plans.length !== LIBRARY_PLAN_COUNT || exerciseCount(plans) !== LIBRARY_EXERCISE_COUNT) {
    throw new Error('Exercise library counts do not match the source.')
  }
  plansCache = plans
  return plans
}

export function remedyGuide(): RemedyGuide {
  if (guideCache) return guideCache
  const guide = guideFile as RemedyGuide
  if (guide.calculator !== 'excluded') throw new Error('The medication calculator is excluded.')
  if (!guide.sections.some((section) => section.id === 'sore-throat')) throw new Error('Remedy guide is incomplete.')
  if (!guide.sections.some((section) => section.kidsTable)) throw new Error('Kids safety table is missing.')
  guideCache = guide
  return guide
}
