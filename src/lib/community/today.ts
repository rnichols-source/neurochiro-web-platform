/**
 * The one next step on Home. An assigned plan comes first.
 * With nothing assigned, the member chooses a home doctor or checks in.
 */

export type TodayPlan = {
  title: string
  detail: string
  done: number
  total: number
  href: string
}

export type TodayFocus =
  | { kind: 'plan'; plan: TodayPlan }
  | { kind: 'doctor' }
  | { kind: 'checkin' }
  | { kind: 'show' }

export function splitPhaseName(name: string): { short: string; rest: string } {
  const index = name.indexOf(':')
  if (index === -1) return { short: name.trim(), rest: '' }
  return { short: name.slice(0, index).trim(), rest: name.slice(index + 1).trim() }
}

export function firstOpenPhase(phases: readonly { done: number; total: number }[]): number {
  const open = phases.findIndex((phase) => phase.total > 0 && phase.done < phase.total)
  if (open >= 0) return open
  return Math.max(0, phases.length - 1)
}

export function todayFocus(input: {
  hasDoctor: boolean
  checkedIn: boolean
  plan: TodayPlan | null
}): TodayFocus {
  if (input.plan && input.plan.total > 0) return { kind: 'plan', plan: input.plan }
  if (!input.hasDoctor) return { kind: 'doctor' }
  if (!input.checkedIn) return { kind: 'checkin' }
  return { kind: 'show' }
}
