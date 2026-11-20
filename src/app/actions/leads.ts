'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { resolveDoctorRowId } from '@/lib/leads/doctor-id'

export async function submitLeadAction(formData: FormData) {
  const supabase = createServerSupabase()
  
  const email = formData.get('email') as string
  const location = formData.get('location') as string
  const firstName = formData.get('first_name') as string
  const role = formData.get('role') as string || 'patient'
  const source = formData.get('source') as string || 'directory'
  const doctorId = await resolveDoctorRowId(createAdminClient() as never, formData.get('doctor_id') as string)

  const { error } = await supabase
    .from('leads')
    .insert({
      email,
      location,
      first_name: firstName,
      role,
      source,
      doctor_id: doctorId || null,
      status: 'new',
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: 'browser'
      }
    })

  if (error) {
    console.error("Lead submission error:", error)
    return { error: "Failed to submit request. Please try again." }
  }

  return { success: true }
}
