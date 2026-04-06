'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getSavedDoctors(ids: string[]) {
  if (!ids.length) return []
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('doctors')
    .select('id, first_name, last_name, clinic_name, slug, city, state, specialties, photo_url, membership_tier')
    .in('id', ids)
  return data || []
}

export async function getSavedJobs(ids: string[]) {
  if (!ids.length) return []
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('job_postings')
    .select('id, title, type, doctor_id, created_at')
    .in('id', ids)
  return data || []
}

export async function getSavedSeminars(ids: string[]) {
  if (!ids.length) return []
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('seminars')
    .select('id, title, city, country, dates, host_id')
    .in('id', ids)
  return data || []
}

export async function getSavedVendors(ids: string[]) {
  if (!ids.length) return []
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('vendors')
    .select('id, name, slug, short_description, tier')
    .in('id', ids)
  return data || []
}
