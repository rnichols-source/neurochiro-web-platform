'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getStudentDashboardData() {
  const supabase = createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('role, tier, full_name')
      .eq('id', user.id)
      .single()

    const { data: student } = await (supabase as any)
      .from('students')
      .select('school, graduation_year, interests, location_city')
      .eq('id', user.id)
      .single()

    const { count: applicationsCount } = await (supabase as any)
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', user.id)

    // Calculate dynamic readiness score
    let readiness = 20; // Base
    if ((student as any)?.school) readiness += 20;
    if ((student as any)?.graduation_year) readiness += 20;
    if ((student as any)?.location_city) readiness += 20;
    if ((student as any)?.interests && (student as any).interests.length > 0) readiness += 20;

    return {
      profile: {
        name: (profile as any)?.full_name?.split(' ')[0] || user.email?.split('@')[0],
        fullName: (profile as any)?.full_name,
        role: (profile as any)?.role,
        status: ((profile as any)?.tier && (profile as any)?.tier !== 'free') ? 'active' : 'inactive',
        school: (student as any)?.school || "Life University",
        gradYear: (student as any)?.graduation_year || "2027"
      },
      stats: {
        readiness: readiness,
        applications: applicationsCount || 0,
        matchScore: (student as any)?.location_city ? 9.2 : 0
      }
    }
  } catch (e) {
    console.error("Student Dashboard Error:", e)
    return null
  }
}

export async function getJobsForRadar() {
  const supabase = createServerSupabase()
  
  try {
    const { data: jobs, error } = await (supabase as any)
      .from('jobs')
      .select('*, doctors(clinic_name, photo_url)')
      .eq('status', 'open')
      .limit(5);

    if (error) throw error;
    return jobs || [];
  } catch (e) {
    console.error("Error fetching jobs for radar:", e);
    return [];
  }
}

export async function transitionToDoctorAction() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  try {
    // 1. Update Profile Role
    const { error: profileError } = await (supabase as any)
      .from('profiles')
      .update({ role: 'doctor' })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Fetch full name for the doctor record
    const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        
    const fullName = (profile as any)?.full_name || "New Doctor"
    const nameParts = fullName.split(' ')
    const firstName = nameParts[0]
    const lastName = nameParts.slice(1).join(' ') || "Doctor"

    // 3. Create Doctor Record (if not exists)
    const baseSlug = `${firstName}-${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '-')
    const slug = `${baseSlug}-${Math.floor(Math.random() * 10000)}`

    const { error: doctorError } = await (supabase as any)
      .from('doctors')
      .upsert({ 
        user_id: user.id, 
        first_name: firstName,
        last_name: lastName,
        slug: slug,
        verification_status: 'pending' 
      }, { onConflict: 'user_id' })

    if (doctorError) throw doctorError
    
    return { success: true }
  } catch (error) {
    console.error("Failed to transition to doctor:", error)
    return { error: "Failed to transition account." }
  }
}
