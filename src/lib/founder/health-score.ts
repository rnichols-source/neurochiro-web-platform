export type HealthTone = 'ok' | 'warn' | 'risk'

export type HealthInput = {
  waiting48: number
  requests: number
  replied: number
  lastSignIn: string | null
  hasPhoto: boolean
  now: Date
}

export type HealthResult = {
  score: number
  tone: HealthTone
  reasons: string[]
}

const DAY = 86_400_000

export function doctorHealth(input: HealthInput): HealthResult {
  let score = 100
  const reasons: string[] = []
  if (input.waiting48 > 0) {
    score -= 25
    reasons.push(`${input.waiting48} request${input.waiting48 === 1 ? '' : 's'} waiting 48h+`)
  }
  if (input.requests >= 2 && input.replied / input.requests < 0.5) {
    score -= 15
    reasons.push(`Replied to ${input.replied} of ${input.requests} requests`)
  }
  const signedIn = input.lastSignIn ? new Date(input.lastSignIn).getTime() : NaN
  if (!Number.isFinite(signedIn) || input.now.getTime() - signedIn > 30 * DAY) {
    score -= 20
    reasons.push(Number.isFinite(signedIn) ? 'No sign-in in 30 days' : 'No sign-in on the profile')
  }
  if (!input.hasPhoto) {
    score -= 10
    reasons.push('No photo')
  }
  score = Math.max(0, Math.min(100, score))
  const tone: HealthTone = score >= 80 ? 'ok' : score >= 50 ? 'warn' : 'risk'
  if (reasons.length === 0) reasons.push('Replying, signed in, and has a photo')
  return { score, tone, reasons }
}
