import 'server-only'
import { createAdminClient } from '@/lib/supabase-admin'
import { readSmsConfig } from './config.ts'
import { sendLeadTexts as deliver } from './engine.ts'
import { supabaseSmsStore } from './store.ts'
import type { DoctorAlertTarget, PatientAlertTarget } from './types.ts'

export async function sendLeadTexts(input: {
  requestId: string
  doctor: DoctorAlertTarget
  patient: PatientAlertTarget
  smsConsentSaved: boolean
  officeBody?: string | null
}): Promise<void> {
  try {
    const db = createAdminClient()
    await deliver({
      requestId: input.requestId,
      doctor: input.doctor,
      patient: input.patient,
      smsConsentSaved: input.smsConsentSaved,
      officeBody: input.officeBody,
      store: supabaseSmsStore(db as unknown as Parameters<typeof supabaseSmsStore>[0]),
      runtime: readSmsConfig(),
    })
  } catch {
    console.warn('[SMS] lead texts stopped')
  }
}
