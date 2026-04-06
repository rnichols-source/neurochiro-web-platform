'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getHostProfile(userId: string) {
  const supabase = createServerSupabase()
  
  // 1. Get the Host Profile info
  const { data: profile, error: profileError } = await supabase
    .from('host_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // 2. If no host profile exists yet, get basic info from the public profile
  if (!profile) {
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', userId)
      .single()
    
    return {
      user_id: userId,
      organization_name: (userProfile as any)?.full_name || 'NeuroChiro Educator',
      host_bio: 'This educator has not yet completed their professional bio.',
      logo_url: (userProfile as any)?.avatar_url,
      is_verified: false,
      seminars: await getHostSeminars(userId)
    }
  }

  // 3. Get all APPROVED seminars for this host
  const seminars = await getHostSeminars(userId)

  return {
    ...profile,
    seminars
  }
}

async function getHostSeminars(userId: string) {
  const supabase = createServerSupabase()
  const { data } = await supabase
    .from('seminars')
    .select('*')
    .eq('host_id', userId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
  
  return data || []
}
