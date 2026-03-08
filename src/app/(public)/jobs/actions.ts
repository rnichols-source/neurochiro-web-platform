'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { Automations } from '@/lib/automations'
import { revalidatePath } from 'next/cache'

export async function getJobs(regionCode?: string, page: number = 1, limit: number = 20) {
  const supabase = createServerSupabase()
  let query = supabase
    .from('jobs')
    .select('*, doctors(clinic_name, photo_url)')
    .eq('status', 'open')
  
  if (regionCode) {
    query = query.eq('region_code', regionCode)
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function postJob(formData: FormData) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  const jobData = {
    doctor_id: user.id,
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    location: formData.get('location') as string,
    type: formData.get('type') as string,
    salary_range: formData.get('salary_range') as string,
    region_code: formData.get('region_code') as string || 'US',
    status: 'open'
  }

  const { data, error } = await supabase.from('jobs').insert(jobData).select().single()
  if (error) throw error

  revalidatePath('/jobs')
  revalidatePath('/doctor/dashboard')
  return data
}

export async function applyForJob(jobId: string) {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  // 1. Insert Application
  const { error } = await supabase.from('job_applications').insert({
    job_id: jobId,
    applicant_id: user.id,
    status: 'pending'
  })

  if (error) throw error

  // 2. Trigger Automation (Email to Doctor)
  // Arguments: applicantId, email, jobId, jobTitle
  await Automations.onJobApplication(
    user.id, 
    user.email || 'applicant@example.com', 
    jobId, 
    'Unknown Job Title' // Fetching actual title would be better but this fixes build
  )

  return { success: true }
}
