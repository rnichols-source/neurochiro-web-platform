'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getAdminSeminars() {
  const supabase = createServerSupabase()

  const { data, error } = await supabase
    .from('seminars')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching admin seminars:", error)
    return []
  }

  // Fetch host names
  if (data && data.length > 0) {
    const hostIds = [...new Set(data.map(s => s.host_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', hostIds)

    const hostMap = new Map((profiles || []).map(p => [p.id, p]))

    return data.map(s => ({
      ...s,
      host: hostMap.get(s.host_id) || null
    }))
  }

  return data || []
}

export async function toggleSeminarApproval(seminarId: string, isApproved: boolean) {
  const supabase = createServerSupabase()

  const { error } = await supabase
    .from('seminars')
    .update({ is_approved: isApproved })
    .eq('id', seminarId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/seminars')
  return { success: true }
}

export async function deleteSeminar(seminarId: string) {
  const supabase = createServerSupabase()

  const { error } = await supabase
    .from('seminars')
    .delete()
    .eq('id', seminarId)

  if (error) throw new Error(error.message)

  revalidatePath('/admin/seminars')
  return { success: true }
}
