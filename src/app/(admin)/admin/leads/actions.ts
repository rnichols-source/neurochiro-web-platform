'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function getLeads() {
  await checkAdminAuth()
  const supabase = createServerSupabase()

  // List view: no message body. Use getLeadDetail() to view message content.
  const { data, error } = await supabase
    .from('leads')
    .select('id, email, first_name, source, role, status, doctor_id, created_at')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    console.error("Error fetching leads:", error)
    return []
  }

  return data || []
}

/**
 * Get full lead detail including message. Logs the access.
 */
export async function getLeadDetail(leadId: string) {
  const user = await checkAdminAuth()
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  if (error) {
    console.error("Error fetching lead detail:", error)
    return null
  }

  // Log access for audit
  console.log(`[LEAD_ACCESS] Admin ${user.id} viewed lead ${leadId} at ${new Date().toISOString()}`)

  return data
}

export async function updateLeadStatus(leadId: string, status: string) {
  await checkAdminAuth()
  const supabase = createServerSupabase()

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

export async function getDemoRegistrants() {
  await checkAdminAuth()
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('source', 'care_plan_closer_demo')
    .order('created_at', { ascending: false })

  if (error) {
    console.error("Error fetching demo registrants:", error)
    return []
  }

  return data || []
}

export async function deleteLeadAction(leadId: string) {
  await checkAdminAuth()
  const supabase = createServerSupabase()

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
