type SeatLookup = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: { id: string }[] | null }>
    }
  }
}

/** A failed Synapse invoice is a flag, not a lapse. There is no nullable flag column on synapse_seats. */
export async function noteSynapsePaymentFailed(admin: unknown, subscriptionId: string | null): Promise<boolean> {
  if (!subscriptionId) return false
  const db = admin as SeatLookup
  const { data } = await db.from('synapse_seats').select('id').eq('stripe_subscription_id', subscriptionId)
  if (!data || data.length === 0) return false
  console.log(`[WEBHOOK] synapse payment failed ${subscriptionId}`)
  return true
}

/** Lapse a Synapse seat when Stripe says the subscription is unpaid or canceled. */
export function synapseUpdateShouldLapse(status: string | null | undefined): boolean {
  return status === 'unpaid' || status === 'canceled'
}
