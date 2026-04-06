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

  // Fetch recipient email for automation
  const { data: recipient } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', recipientId)
    .single()

  await Automations.onReferralSent(
    user.id,
    user.user_metadata?.full_name || 'Dr. Unknown',
    recipientId,
    recipient?.email || '',
    '',
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
    .select('*')
    .or(`referrer_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) throw error

  // Fetch profile names for referrals
  const userIds = [...new Set(data.flatMap(r => [r.referrer_id, r.recipient_id]))]
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds)

  const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

  return data.map(r => ({
    ...r,
    referrer_name: profileMap.get(r.referrer_id) || 'Unknown',
    recipient_name: profileMap.get(r.recipient_id) || 'Unknown'
  }))
}
