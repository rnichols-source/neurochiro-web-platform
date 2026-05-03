'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

/**
 * Notify a doctor when a patient saves their profile.
 * Creates an in-app notification for the doctor.
 */
export async function notifyDoctorSaved(doctorId: string) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get patient name
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    const patientName = (profile as any)?.full_name?.split(' ')[0] || 'A patient'

    // Get doctor's user_id from doctors table
    const admin = createAdminClient()
    const { data: doctor } = await admin
      .from('doctors')
      .select('user_id, city')
      .eq('id', doctorId)
      .maybeSingle()

    if (!(doctor as any)?.user_id) return

    // Send notification
    await admin.from('notifications').insert({
      user_id: (doctor as any).user_id,
      title: 'New Patient Interest',
      body: `${patientName} saved your profile. They may be looking for a chiropractor in ${(doctor as any).city || 'your area'}.`,
      type: 'system',
      link: '/doctor/analytics',
      priority: 'info',
    })
  } catch {
    // Non-critical — fail silently
  }
}
