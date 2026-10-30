export type AckAction = 'called' | 'voicemail' | 'booked' | 'unreachable' | 'will_call'

const ACTIONS = new Set<AckAction>(['called', 'voicemail', 'booked', 'unreachable', 'will_call'])

export function isAckAction(value: unknown): value is AckAction {
  return typeof value === 'string' && ACTIONS.has(value as AckAction)
}

/** Map a confirm-button or dashboard stage onto contact_requests columns. */
export function outcomePatch(action: AckAction, via: string, acknowledgedAt: string | null): Record<string, unknown> {
  const now = new Date().toISOString()
  const ackAt = acknowledgedAt || now
  if (action === 'called' || action === 'booked') {
    return {
      acknowledged_at: ackAt,
      acknowledged_via: via,
      contact_outcome: 'patient_contacted_confirmed',
      status: 'acknowledged',
      outcome_detail: action,
    }
  }
  if (action === 'voicemail' || action === 'will_call') {
    return {
      acknowledged_at: ackAt,
      acknowledged_via: via,
      contact_outcome: 'will_call_today',
      will_call_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      outcome_detail: action === 'voicemail' ? 'voicemail' : null,
    }
  }
  return {
    acknowledged_at: ackAt,
    acknowledged_via: via,
    contact_outcome: 'doctor_unreachable',
    status: 'doctor_unreachable',
    outcome_detail: 'unreachable',
    needs_admin_attention: true,
    attention_reason: 'doctor marked patient unreachable',
  }
}

export function stageToAckAction(stage: string): AckAction | null {
  if (stage === 'contacted') return 'called'
  if (stage === 'scheduled' || stage === 'converted') return 'booked'
  return null
}
