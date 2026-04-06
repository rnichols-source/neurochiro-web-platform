'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Automations } from '@/lib/automations'
import { revalidatePath } from 'next/cache'

export async function getJobs(regionCode?: string, page: number = 1, limit: number = 20) {
  const supabase = createServerSupabase()
  let query = supabase
    .from('job_postings')
    .select('*')
    .eq('status', 'open')

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query
  if (error) throw error

  // Fetch clinic names for each job's doctor
  if (data && data.length > 0) {
    const doctorIds = [...new Set(data.map(j => j.doctor_id))]
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, clinic_name')
      .in('user_id', doctorIds)

    const clinicMap = new Map((doctors || []).map(d => [d.user_id, d.clinic_name]))
    return data.map(j => ({ ...j, clinic_name: clinicMap.get(j.doctor_id) || '' }))
  }

  return data || []
}

export async function postJob(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  const { data, error } = await supabase.from('job_postings').insert({
    doctor_id: user.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    type: formData.get('type') as string,
    status: 'open'
  }).select().single()
  if (error) throw error

  revalidatePath('/jobs')
  revalidatePath('/doctor/dashboard')
  return data
}

export async function applyForJob(jobId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) throw new Error("Unauthorized")

  // 1. Get job info
  const { data: jobInfo } = await supabase
    .from('job_postings')
    .select('title, doctor_id')
    .eq('id', jobId)
    .single();

  // 2. Get doctor's email
  const { data: doctorProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', jobInfo?.doctor_id || '')
    .single();

  // 3. Insert Application
  const { error } = await supabase.from('job_applications').insert({
    job_id: jobId,
    applicant_id: user.id,
  });

  if (error) throw error;

  // 4. Trigger Automation
  const jobTitle = jobInfo?.title || 'Unknown Position';

  await Automations.onJobApplication(
    user.id,
    user.email || 'applicant@example.com',
    jobId,
    jobTitle,
    doctorProfile?.email || 'support@neurochirodirectory.com'
  );

  return { success: true };
}
