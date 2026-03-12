'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getPendingSeminars() {
  const supabase = createServerSupabase()
  
  const { data, error } = await supabase
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
  
  const { error } = await supabase
    .from('seminars')
    .update({ is_approved: true })
    .eq('id', id)

  if (error) throw new Error("Failed to approve seminar")

  revalidatePath('/admin/approvals/seminars')
  revalidatePath('/seminars')
  return { success: true }
}

export async function rejectSeminarAction(id: string, notes: string) {
  const supabase = createServerSupabase()
  
  const { error } = await supabase
    .from('seminars')
    .update({ 
      is_approved: false, 
      admin_notes: notes,
      payment_status: 'rejected'
    })
    .eq('id', id)

  if (error) throw new Error("Failed to reject seminar")

  revalidatePath('/admin/approvals/seminars')
  return { success: true }
}
