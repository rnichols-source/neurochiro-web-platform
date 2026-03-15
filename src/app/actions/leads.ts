'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function submitLeadAction(formData: FormData) {
  const supabase = createServerSupabase()
  
  const email = formData.get('email') as string
  const location = formData.get('location') as string
  const firstName = formData.get('first_name') as string
  const role = formData.get('role') as string || 'patient'
  const source = formData.get('source') as string || 'website_zero_state'

  const { data, error } = await (supabase as any)
    .from('leads')
    .insert({
      email,
      location,
      first_name: firstName,
      role,
      source,
      status: 'new',
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: 'browser'
      }
    })
    .select()
    .single()

  if (error) {
    console.error("Lead submission error:", error)
    return { error: "Failed to submit request. Please try again." }
  }

  return { success: true }
}
