import {
  CONCERN_IDS,
  EXPERIENCE_IDS,
  LEGACY_EXPERIENCE,
  LEGACY_PRIORITY,
  normalizeSource,
  PRIORITY_IDS,
  QUIZ_COUNTRIES,
  QUIZ_STEPS,
  quizCountryFromRegion,
  type ConcernId,
  type EntrySource,
  type ExperienceId,
  type PriorityId,
  type QuizCountry,
  type QuizStep,
} from './options.ts'

export type QuizAnswers = {
  v: 2
  concern: ConcernId | ''
  country: QuizCountry
  postal: string
  city: string
  region: string
  experience: ExperienceId | ''
  priority: PriorityId | ''
  source: EntrySource
  sessionId: string
  startedAt: number
}

const STEP_ORDER = QUIZ_STEPS

function isConcern(value: unknown): value is ConcernId {
  return typeof value === 'string' && (CONCERN_IDS as readonly string[]).includes(value)
}

function isExperience(value: unknown): value is ExperienceId {
  return typeof value === 'string' && (EXPERIENCE_IDS as readonly string[]).includes(value)
}

function isPriority(value: unknown): value is PriorityId {
  return typeof value === 'string' && (PRIORITY_IDS as readonly string[]).includes(value)
}

function isCountry(value: unknown): value is QuizCountry {
  return typeof value === 'string' && (QUIZ_COUNTRIES as readonly string[]).includes(value)
}

export function blankAnswers(input: { source?: string | null; country?: string | null; sessionId: string; startedAt: number }): QuizAnswers {
  return {
    v: 2,
    concern: '',
    country: quizCountryFromRegion(input.country),
    postal: '',
    city: '',
    region: '',
    experience: '',
    priority: '',
    source: normalizeSource(input.source),
    sessionId: input.sessionId,
    startedAt: input.startedAt,
  }
}

export function hasLocation(answers: Pick<QuizAnswers, 'postal' | 'city' | 'region'>): boolean {
  if (answers.postal.trim()) return true
  return answers.city.trim().length > 0 && answers.region.trim().length > 0
}

export function firstReachableStep(answers: QuizAnswers): QuizStep {
  if (!answers.concern) return 'concern'
  if (!hasLocation(answers)) return 'location'
  if (!answers.experience) return 'experience'
  if (!answers.priority) return 'priority'
  return 'results'
}

export function clampStep(requested: string | null | undefined, answers: QuizAnswers): QuizStep {
  const reachable = firstReachableStep(answers)
  const step: QuizStep = requested && (STEP_ORDER as readonly string[]).includes(requested)
    ? requested as QuizStep
    : 'concern'
  if (STEP_ORDER.indexOf(step) > STEP_ORDER.indexOf(reachable)) return reachable
  return step
}

export function quizHref(step: QuizStep, source: EntrySource): string {
  const params = new URLSearchParams()
  params.set('step', step)
  if (source && source !== 'direct') params.set('source', source)
  return `/quiz?${params.toString()}`
}

export function serializeAnswers(answers: QuizAnswers): string {
  return JSON.stringify(answers)
}

export function parseAnswers(raw: unknown, fallback: QuizAnswers): QuizAnswers {
  if (!raw || typeof raw !== 'object') return fallback
  const row = raw as Record<string, unknown>
  if (row.v !== 2) return fallback
  const experienceRaw = typeof row.experience === 'string' ? (LEGACY_EXPERIENCE[row.experience] || row.experience) : ''
  const priorityRaw = typeof row.priority === 'string' ? (LEGACY_PRIORITY[row.priority] || row.priority) : ''
  const sessionId = typeof row.sessionId === 'string' && row.sessionId ? row.sessionId : fallback.sessionId
  const startedAt = typeof row.startedAt === 'number' ? row.startedAt : fallback.startedAt
  return {
    v: 2,
    concern: isConcern(row.concern) ? row.concern : '',
    country: isCountry(row.country) ? row.country : fallback.country,
    postal: typeof row.postal === 'string' ? row.postal.slice(0, 10) : '',
    city: typeof row.city === 'string' ? row.city.slice(0, 80) : '',
    region: typeof row.region === 'string' ? row.region.slice(0, 40) : '',
    experience: isExperience(experienceRaw) ? experienceRaw : '',
    priority: isPriority(priorityRaw) ? priorityRaw : '',
    source: normalizeSource(typeof row.source === 'string' ? row.source : fallback.source),
    sessionId,
    startedAt,
  }
}

/** Clears the loading flag even when the action throws, so the spinner cannot stick. */
export async function settle<T>(
  run: () => Promise<T>,
  setLoading: (value: boolean) => void,
): Promise<T | { ok: false; code: 'error'; message: string }> {
  setLoading(true)
  try {
    return await run()
  } catch {
    return { ok: false, code: 'error', message: 'Something went wrong. Please try again.' }
  } finally {
    setLoading(false)
  }
}
