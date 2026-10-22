'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function unsubscribeByEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (!email || !email.includes('@')) return { success: false, error: 'Please enter a valid email address.' }

  const admin = createAdminClient()
  const normalizedEmail = email.trim().toLowerCase()
  let found = false

  // 1. Check subscribers table
  const { data: subscriber } = await (admin as any)
    .from('subscribers')
    .select('id, unsubscribed_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (subscriber && !subscriber.unsubscribed_at) {
    await (admin as any)
      .from('subscribers')
      .update({ unsubscribed_at: new Date().toISOString(), status: 'unsubscribed' })
      .eq('id', subscriber.id)
    found = true
  } else if (subscriber?.unsubscribed_at) {
    found = true // already unsubscribed
  }

  // 2. Check leads table
  const { data: lead } = await (admin as any)
    .from('leads')
    .select('id, status')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (lead && lead.status !== 'unsubscribed') {
    await (admin as any)
      .from('leads')
      .update({ status: 'unsubscribed' })
      .eq('id', lead.id)
    found = true
  } else if (lead?.status === 'unsubscribed') {
    found = true
  }

  // 3. Check email_preferences on profiles (for logged-in members)
  const { data: profile } = await admin
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (profile) {
    await (admin as any)
      .from('email_preferences')
      .upsert(
        { user_id: profile.id, marketing_opt_in: false },
        { onConflict: 'user_id' }
      )
    found = true
  }

  if (!found) {
    // Still mark as success — don't reveal whether the email exists
    return { success: true }
  }

  return { success: true }
}
