'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { onSeminarApprovedAction, onSeminarRejectedAction } from '@/app/actions/automations'

export async function getPendingSeminars() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('seminars')
    .select('*')
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching pending seminars:", error)
    return []
  }

  // Fetch host details for each seminar
  const hostIds = [...new Set(data.map(s => s.host_id))]
  const { data: hosts } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .in('id', hostIds)

  const hostMap = new Map((hosts || []).map(h => [h.id, h]))

  return data.map(s => ({
    ...s,
    host: hostMap.get(s.host_id) || { full_name: 'Unknown', email: '' }
  }))
}

export async function approveSeminarAction(id: string) {
  const supabase = createAdminClient()

  const { data: seminar, error: fetchError } = await supabase
    .from('seminars')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !seminar) throw new Error("Seminar not found")

  const { data: host } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', seminar.host_id)
    .single()

  const { error } = await supabase
    .from('seminars')
    .update({ is_approved: true })
    .eq('id', id)

  if (error) throw new Error("Failed to approve seminar")

  await onSeminarApprovedAction(seminar.host_id, host?.email || '', seminar.title)

  revalidatePath('/admin/approvals/seminars')
  revalidatePath('/seminars')
  return { success: true }
}

export async function rejectSeminarAction(id: string, notes: string) {
  const supabase = createAdminClient()

  const { data: seminar, error: fetchError } = await supabase
    .from('seminars')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !seminar) throw new Error("Seminar not found")

  const { data: host } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', seminar.host_id)
    .single()

  const { error } = await supabase
    .from('seminars')
    .update({
      is_approved: false,
      admin_notes: notes,
      payment_status: 'rejected'
    })
    .eq('id', id)

  if (error) throw new Error("Failed to reject seminar")

  await onSeminarRejectedAction(seminar.host_id, host?.email || '', seminar.title, notes)

  revalidatePath('/admin/approvals/seminars')
  return { success: true }
}
