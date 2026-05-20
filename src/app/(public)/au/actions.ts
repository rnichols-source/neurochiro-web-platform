'use server'

import { createAdminClient } from '@/lib/supabase-admin'

export async function captureAULead(email: string, name: string, role: string) {
  if (!email) return { error: 'Email is required' }

  // Block fake/test domains
  const domain = email.split('@')[1]?.toLowerCase()
  const blocked = ['demo.com', 'test.com', 'example.com', 'fake.com', 'mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com']
  if (domain && blocked.includes(domain)) {
    return { success: true } // Silent reject
  }

  const supabase = createAdminClient()

  const { error } = await supabase
    .from('leads')
    .insert({
      email: email.toLowerCase().trim(),
      first_name: name.trim() || null,
      source: 'au_landing',
      role: role || 'unknown',
      location: 'Australia',
      status: 'new',
    })

  if (error) {
    console.error('[AU Lead] Capture error:', error.message)
    return { error: 'Something went wrong. Try again.' }
  }

  return { success: true }
}
