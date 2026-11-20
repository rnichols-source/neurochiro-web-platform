/**
 * Patient request stages. History stores the stage and the time only.
 * Phone, email, and the request message stay on the original row.
 */

export const PIPELINE_STAGES = [
  'requested',
  'contacted',
  'scheduled',
  'started_care',
  'not_a_fit',
  'no_answer',
  'went_elsewhere',
] as const

export type PipelineStage = (typeof PIPELINE_STAGES)[number]

export const OPEN_STAGES = ['requested', 'contacted', 'scheduled', 'started_care'] as const

export const CLOSE_STAGES = ['not_a_fit', 'no_answer', 'went_elsewhere'] as const

const STAGE_LABELS: Record<string, string> = {
  requested: 'Requested',
  contacted: 'Contacted',
  scheduled: 'Scheduled',
  started_care: 'Started care',
  not_a_fit: 'Not a fit',
  no_answer: 'No answer',
  went_elsewhere: 'Went elsewhere',
  closed: 'Closed',
}

const NEXT: Partial<Record<PipelineStage, PipelineStage>> = {
  requested: 'contacted',
  contacted: 'scheduled',
  scheduled: 'started_care',
}

export function isPipelineStage(value: string | null | undefined): value is PipelineStage {
  return PIPELINE_STAGES.includes(value as PipelineStage)
}

export function isClosedStage(stage: string | null | undefined): boolean {
  return stage === 'closed' || CLOSE_STAGES.includes(stage as (typeof CLOSE_STAGES)[number])
}

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return 'Requested'
  return STAGE_LABELS[stage] || 'Requested'
}

export function nextStage(stage: string | null | undefined): PipelineStage | null {
  if (!isPipelineStage(stage)) return null
  return NEXT[stage] || null
}

/** Map an older lead or visit status onto the pipeline. */
export function stageFromLegacy(stage: string | null | undefined): string {
  const value = (stage || 'new').toLowerCase()
  if (value === 'converted' || value === 'started_care' || value === 'started') return 'started_care'
  if (value === 'scheduled' || value === 'booked') return 'scheduled'
  if (value === 'contacted' || value === 'follow_up' || value === 'seen') return 'contacted'
  if (value === 'not_a_fit' || value === 'no_answer' || value === 'went_elsewhere') return value
  if (value === 'closed') return 'closed'
  return 'requested'
}

/** leads.stage check allows only these four. Close reasons stay on the pipeline table. */
export function legacyLeadStage(stage: PipelineStage): 'new' | 'contacted' | 'scheduled' | 'converted' | null {
  if (stage === 'requested') return 'new'
  if (stage === 'contacted') return 'contacted'
  if (stage === 'scheduled') return 'scheduled'
  if (stage === 'started_care') return 'converted'
  return null
}

export type StageEvent = { stage: string; at: string }

export function historyForRequest(input: {
  createdAt: string
  stage: string
  contactedAt?: string | null
  bookedAt?: string | null
  events?: StageEvent[] | null
}): StageEvent[] {
  const saved = (input.events || []).filter((event) => event.stage && event.at)
  if (saved.length) {
    return [...saved].sort((a, b) => a.at.localeCompare(b.at))
  }
  const created = input.createdAt
  const rows: StageEvent[] = [{ stage: 'requested', at: created }]
  const stage = input.stage
  if (stage === 'contacted' || stage === 'scheduled' || stage === 'started_care') {
    rows.push({ stage: 'contacted', at: input.contactedAt || created })
  }
  if (stage === 'scheduled' || stage === 'started_care') {
    rows.push({ stage: 'scheduled', at: input.bookedAt || input.contactedAt || created })
  }
  if (stage === 'started_care') {
    rows.push({ stage: 'started_care', at: input.bookedAt || input.contactedAt || created })
  }
  if (isClosedStage(stage) && stage !== 'requested') {
    rows.push({ stage, at: input.contactedAt || created })
  }
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.stage}:${row.at}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export type ContactKind = 'visit' | 'lead' | 'contact_request' | 'referral'

/**
 * Contact info is shown only to the doctor who owns the request.
 * Visit rows must pass the fields the patient chose to share, not the account profile.
 * Referral phone and email stay hidden until the receiving doctor accepts.
 */
export function visibleRequestContact(input: {
  kind: ContactKind
  doctorId: string
  ownerDoctorId: string
  email: string | null
  phone: string | null
  referralStatus?: string | null
}): { email: string | null; phone: string | null } {
  if (!input.doctorId || input.doctorId !== input.ownerDoctorId) return { email: null, phone: null }
  if (input.kind === 'referral') {
    const status = (input.referralStatus || '').toLowerCase()
    const open = status === 'accepted' || status === 'patient_contacted' || status === 'scheduled'
    if (!open) return { email: null, phone: null }
  }
  return {
    email: cleanContact(input.email),
    phone: cleanContact(input.phone),
  }
}

function cleanContact(value: string | null | undefined): string | null {
  const text = (value || '').trim()
  return text || null
}

export function monthlyStageCounts(
  events: { doctorId: string; stage: string; at: string }[],
): { doctorId: string; monthStart: string; scheduled: number; startedCare: number }[] {
  const buckets = new Map<string, { doctorId: string; monthStart: string; scheduled: number; startedCare: number }>()
  for (const event of events) {
    const monthStart = `${event.at.slice(0, 7)}-01`
    const key = `${event.doctorId}:${monthStart}`
    const row = buckets.get(key) || { doctorId: event.doctorId, monthStart, scheduled: 0, startedCare: 0 }
    if (event.stage === 'scheduled') row.scheduled += 1
    if (event.stage === 'started_care') row.startedCare += 1
    buckets.set(key, row)
  }
  return [...buckets.values()].filter((row) => row.scheduled > 0 || row.startedCare > 0)
}
