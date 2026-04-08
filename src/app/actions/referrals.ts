'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function sendReferral(recipientDoctorId: string, patientName?: string, notes?: string) {

  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  // Get the recipient's user_id from the doctors table
  const { data: recipientDoctor } = await supabase
    .from('doctors')
    .select('user_id, first_name, last_name')
    .eq('id', recipientDoctorId)
    .single()

  if (!recipientDoctor?.user_id) throw new Error("Recipient doctor not found")

  // Insert the referral
  const { data, error } = await supabase
    .from('referrals')
    .insert({
      referrer_id: user.id,
      recipient_id: recipientDoctor.user_id,
      patient_name: patientName || null,
      notes: notes || null,
      status: 'sent'
    })
    .select()
    .single()

  if (error) throw new Error("Failed to send referral")

  // Get referrer name for the notification
  const { data: referrerProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Send notification to the receiving doctor
  await supabase.from('notifications').insert({
    user_id: recipientDoctor.user_id,
    title: 'New Patient Referral',
    body: `${referrerProfile?.full_name || 'A doctor'} sent you a patient referral${patientName ? ` for ${patientName}` : ''}.`,
    type: 'referral',
    priority: 'important',
    link: '/doctor/dashboard'
  })

  revalidatePath('/doctor/dashboard')
  return { success: true }
}

export async function getReferralsSent() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('referrer_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data || data.length === 0) return []

  // Enrich with recipient names
  const recipientIds = data.map(r => r.recipient_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', recipientIds)

  const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

  return data.map(r => ({
    ...r,
    recipient_name: nameMap.get(r.recipient_id) || 'Unknown Doctor'
  }))
}

export async function getReferralsReceived() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('referrals')
    .select('*')
    .eq('recipient_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)

  if (!data || data.length === 0) return []

  // Enrich with referrer names
  const referrerIds = data.map(r => r.referrer_id)
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', referrerIds)

  const nameMap = new Map((profiles || []).map(p => [p.id, p.full_name]))

  return data.map(r => ({
    ...r,
    referrer_name: nameMap.get(r.referrer_id) || 'Unknown Doctor'
  }))
}

export async function acknowledgeReferral(referralId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('referrals')
    .update({ status: 'acknowledged' })
    .eq('id', referralId)
    .eq('recipient_id', user.id)

  if (error) throw new Error("Failed to acknowledge referral")

  revalidatePath('/doctor/dashboard')
  return { success: true }
}

export async function getReferralAnalytics() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const [sentRes, receivedRes] = await Promise.all([
    supabase.from('referrals').select('*').eq('referrer_id', user.id),
    supabase.from('referrals').select('*').eq('recipient_id', user.id)
  ])

  const sent = sentRes.data || []
  const received = receivedRes.data || []

  return {
    totalSent: sent.length,
    totalReceived: received.length,
    sentAcknowledged: sent.filter(r => r.status === 'acknowledged').length,
    receivedAcknowledged: received.filter(r => r.status === 'acknowledged').length,
    thisMonth: {
      sent: sent.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      received: received.filter(r => new Date(r.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    }
  }
}
