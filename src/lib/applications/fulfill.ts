import 'server-only'

import { cancelUnpaidSubscription, paymentMethodFromSetupIntent, paymentMethodFromSetupSession, stripeBilling } from './billing.ts'
import { approveApplication } from './decide.ts'
import { pingApplicationDiscord } from './notify.ts'
import { markCardOnFile } from './store.ts'
import { finishDecision } from '@/lib/go-live/finish'

type SavedCard = NonNullable<Awaited<ReturnType<typeof markCardOnFile>>>

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
    confirmed: true,
  })
  if (!savedCard) return false
  await settleSavedCard(savedCard, saved.userId)
  return true
}

/** Idempotent. Used when the card was confirmed with Stripe Elements on our page. */
export async function fulfillDoctorApplicationSetupIntent(setupIntentId: string, expectedUserId?: string): Promise<boolean> {
  if (!setupIntentId) return false
  const saved = await paymentMethodFromSetupIntent(setupIntentId)
  if (!saved) return false
  if (expectedUserId && saved.userId && saved.userId !== expectedUserId) return false
  const savedCard = await markCardOnFile({
    applicationId: saved.applicationId,
    customerId: saved.customerId,
    paymentMethodId: saved.paymentMethodId,
    sessionId: setupIntentId,
    userId: saved.userId,
    doctorId: saved.doctorId,
    confirmed: true,
  })
  if (!savedCard) return false
  await settleSavedCard(savedCard, saved.userId)
  return true
}

async function settleSavedCard(savedCard: SavedCard, userId: string): Promise<void> {
  if (savedCard.notify) {
    await pingApplicationDiscord({ ...savedCard.application.answers, cardOnFile: true })
  }
  if (savedCard.cancelSubscriptionId) await cancelUnpaidSubscription(savedCard.cancelSubscriptionId)
  if (!savedCard.recharge) return
  const decision = await approveApplication(savedCard.application, stripeBilling(), new Date().toISOString(), '')
  await finishDecision({
    application: savedCard.application,
    decision,
    reviewerId: userId || null,
  })
}
