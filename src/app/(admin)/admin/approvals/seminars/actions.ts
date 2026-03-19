'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { onSeminarApprovedAction, onSeminarRejectedAction } from '@/app/actions/automations'

export async function getPendingSeminars() {
  const supabase = createServerSupabase()
  
  const { data, error } = await (supabase as any)
    .from('seminars')
    .select(`
      *,
      host:host_id (
        full_name,
        email
      )
    `)
    .eq('is_approved', false)
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching pending seminars:", error)
    return []
  }

  return data
}

export async function approveSeminarAction(id: string) {
  const supabase = createServerSupabase()
  
  const { data: seminar, error: fetchError } = await (supabase as any)
    .from('seminars')
    .select('*, host:host_id(email, full_name)')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error("Seminar not found")

  const { error } = await (supabase as any)
    .from('seminars')
    .update({ is_approved: true } as any)
    .eq('id', id)

  if (error) throw new Error("Failed to approve seminar")

  // Trigger Automation (Notify Host)
  await onSeminarApprovedAction(seminar.host_id, seminar.host.email, seminar.title)

  revalidatePath('/admin/approvals/seminars')
  revalidatePath('/seminars')
  return { success: true }
}

export async function rejectSeminarAction(id: string, notes: string) {
  const supabase = createServerSupabase()
  
  const { data: seminar, error: fetchError } = await (supabase as any)
    .from('seminars')
    .select('*, host:host_id(email, full_name)')
    .eq('id', id)
    .single()

  if (fetchError) throw new Error("Seminar not found")

  const { error } = await (supabase as any)
    .from('seminars')
    .update({ 
      is_approved: false, 
      admin_notes: notes,
      payment_status: 'rejected'
    } as any)
    .eq('id', id)

  if (error) throw new Error("Failed to reject seminar")

  // Trigger Automation (Notify Host)
  await onSeminarRejectedAction(seminar.host_id, seminar.host.email, seminar.title, notes)

  revalidatePath('/admin/approvals/seminars')
  return { success: true }
}
