'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { checkAdminAuth } from '@/lib/admin-auth'

export async function getAdminJobPostings() {
  await checkAdminAuth();
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching admin job postings:", error)
    return []
  }

  // Fetch doctor names for each job
  if (data && data.length > 0) {
    const doctorIds = [...new Set(data.map(j => j.doctor_id))]
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, clinic_name')
      .in('user_id', doctorIds)

    const doctorMap = new Map((doctors || []).map(d => [d.user_id, d]))

    return data.map(j => ({
      ...j,
      doctor: doctorMap.get(j.doctor_id) || null
    }))
  }

  return data || []
}

export async function updateJobStatus(jobId: string, status: string) {
  await checkAdminAuth();
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('job_postings')
    .update({ status })
    .eq('id', jobId)

  if (error) throw new Error(error.message)
  return { success: true }
}

export async function deleteJobPosting(jobId: string) {
  await checkAdminAuth();
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('job_postings')
    .delete()
    .eq('id', jobId)

  if (error) throw new Error(error.message)
  return { success: true }
}
