import 'server-only'

import { membershipTierForStripeStatus } from './membership.ts'

type QueryClient = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{ data: Array<Record<string, unknown>> | null; error: { message?: string } | null }>
    }
    update: (values: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<unknown>
    }
  }
}

/**
 * When a membership subscription changes, update the doctor who saved that Stripe customer.
 * Safe to run twice for the same event. Missing table is ignored so old webhooks keep working.
 */
export async function syncDoctorMembershipByCustomer(
  admin: unknown,
  customerId: string,
  stripeStatus: string,
): Promise<void> {
  const client = admin as unknown as QueryClient
  const tier = membershipTierForStripeStatus(stripeStatus)
  const apps = await client.from('doctor_applications').select('id, user_id, doctor_id, status').eq('stripe_customer_id', customerId)
  if (apps.error || !Array.isArray(apps.data)) return

  for (const row of apps.data as Array<{ id?: string; user_id?: string | null; doctor_id?: string | null; status?: string }>) {
    if (tier && row.doctor_id) {
      await client.from('doctors').update({ membership_tier: tier }).eq('id', row.doctor_id)
    }
    if (tier === 'pro' && row.id && row.status === 'needs_action') {
      await client.from('doctor_applications').update({
        status: 'approved',
        updated_at: new Date().toISOString(),
      }).eq('id', row.id)
    }
    if (row.user_id && tier) {
      await client.from('profiles').update({
        tier: tier === 'pro' ? 'pro' : 'free',
        subscription_status: stripeStatus,
        stripe_customer_id: customerId,
      }).eq('id', row.user_id)
    }
  }
}
