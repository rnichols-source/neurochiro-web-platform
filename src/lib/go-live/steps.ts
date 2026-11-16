export const GO_LIVE_STEPS = [
  'checkout',
  'profile',
  'portal',
  'welcome',
  'waitlist',
  'instagram',
  'summary',
] as const

export type GoLiveStep = (typeof GO_LIVE_STEPS)[number]
export type GoLiveStatus = 'ok' | 'failed' | 'skipped' | 'pending'

export const APPROVAL_GO_LIVE_STEPS: GoLiveStep[] = [
  'checkout',
  'profile',
  'portal',
  'welcome',
  'waitlist',
  'instagram',
  'summary',
]

export type GoLiveStepResult = {
  step: GoLiveStep
  status: GoLiveStatus
  reason: string
  detail?: Record<string, unknown>
}
