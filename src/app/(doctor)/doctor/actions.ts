'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Automations } from '@/lib/automations'
import { revalidatePath } from 'next/cache'

export async function sendReferral(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  const recipientId = formData.get('recipient_id') as string
  const patientName = formData.get('patient_name') as string
  const notes = formData.get('notes') as string

  const { data, error } = await supabase.from('referrals').insert({
    referrer_id: user.id,
    recipient_id: recipientId,
    patient_name: patientName,
    notes: notes,
    status: 'sent'
  }).select().single()

  if (error) throw error

  // Trigger Automation (Notify receiving doctor)
  // Arguments: referrerId, referrerName, doctorId, doctorEmail, phone, patientName
  await Automations.onReferralSent(
    user.id, 
    user.user_metadata?.full_name || 'Dr. Unknown', 
    recipientId, 
    'recipient@example.com', // In a real flow, fetch recipient email from DB
    '000-000-0000', // Placeholder
    patientName
  )

  revalidatePath('/doctor/dashboard')
  return data
}

export async function getReferrals() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('referrals')
    .select('*, referrer:profiles!referrer_id(full_name), recipient:profiles!recipient_id(full_name)')
    .or(`referrer_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
