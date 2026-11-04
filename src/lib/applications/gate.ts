import 'server-only'

import { loadApplicationByDoctor } from './store.ts'
import type { ApplicationGate } from './gate-kind.ts'

export type { ApplicationGate } from './gate-kind.ts'

export async function loadApplicationGate(doctorId: string): Promise<ApplicationGate | null> {
  try {
    const app = await loadApplicationByDoctor(doctorId)
    if (!app) return null
    if (app.status === 'declined') return 'declined'
    if (app.status === 'needs_action') return 'needs_action'
    if (app.status === 'approved') return null
    if (app.cardOnFile || app.status === 'under_review') return 'review'
    return 'finish'
  } catch (error) {
    console.error('[application] gate lookup failed', error instanceof Error ? error.name : 'error')
    return null
  }
}
