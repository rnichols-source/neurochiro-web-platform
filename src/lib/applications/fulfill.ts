import 'server-only'

import { paymentMethodFromSetupSession } from './billing.ts'
import { pingApplicationDiscord } from './notify.ts'
import { markCardOnFile } from './store.ts'

type SessionLike = { id?: string | null }

/** Idempotent. The webhook and the return page can both call this. */
export async function fulfillDoctorApplicationSetup(session: SessionLike, expectedUserId?: string): Promise<boolean> {
  if (!session.id) return false
  const saved = await paymentMethodFromSetupSession(session.id)
  if (!saved) return false
  if (expectedUserId && saved.userId && saved.userId !== expectedUserId) return false
  const savedCard = await markCardOnFile({
    applicationId: saved.applicationId,
    customerId: saved.customerId,
    paymentMethodId: saved.paymentMethodId,
    sessionId: session.id,
    userId: saved.userId,
    doctorId: saved.doctorId,
  })
  if (!savedCard) return false
  if (savedCard.notify) {
    await pingApplicationDiscord({ ...savedCard.application.answers, cardOnFile: true })
  }
  return true
}
