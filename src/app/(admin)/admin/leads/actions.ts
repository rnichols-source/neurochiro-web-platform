'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getLeads() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error fetching leads:", error)
    return []
  }

  return data || []
}

export async function updateLeadStatus(leadId: string, status: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('leads')
    .update({ status })
    .eq('id', leadId)

  if (error) {
    console.error("Error updating lead:", error)
    throw error
  }

  return { success: true }
}

export async function deleteLeadAction(leadId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const { error } = await supabase
    .from('leads')
    .delete()
    .eq('id', leadId)

  if (error) {
    console.error("Error deleting lead:", error)
    throw error
  }

  return { success: true }
}
