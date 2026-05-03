'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getStudentDashboardData() {
  const supabase = createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tier, full_name, subscription_status')
      .eq('id', user.id)
      .single()

    const { data: student } = await supabase
      .from('students')
      .select('school, graduation_year, interests, location_city')
      .eq('id', user.id)
      .single()

    const { count: applicationsCount } = await supabase
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
        subscription_status: (profile as any)?.subscription_status || null,
        school: (student as any)?.school || null,
        gradYear: (student as any)?.graduation_year || null,
        city: (student as any)?.location_city || null
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

export async function getAcademyProgress() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  // 6 courses: 4+4+4+6+6+4 = 28 modules total
  const TOTAL_MODULES = 28
  if (!user) return { completed: 0, total: TOTAL_MODULES }

  const { data } = await supabase
    .from('course_progress')
    .select('completed_modules')
    .eq('user_id', user.id)

  let completed = 0
  if (data) {
    data.forEach(row => {
      const modules = Array.isArray(row.completed_modules) ? row.completed_modules : []
      completed += modules.length
    })
  }

  return { completed, total: TOTAL_MODULES }
}

export async function getUpcomingSeminarsForStudent() {
  const supabase = createServerSupabase()
  try {
    const { data } = await supabase
      .from('seminars')
      .select('id, title, dates, city, country, price, instructor_name')
      .eq('is_approved', true)
      .eq('is_past', false)
      .order('dates', { ascending: true })
      .limit(3)
    return data || []
  } catch { return [] }
}

export { getRecentJobs as getJobsForRadar };

export async function getRecentJobs() {
  const supabase = createServerSupabase()
  try {
    const { data } = await supabase
      .from('job_postings')
      .select('id, title, employment_type, salary_min, salary_max, created_at, doctor_id')
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(3);

    if (!data || data.length === 0) return [];

    // Get clinic names
    const doctorIds = [...new Set(data.map(j => j.doctor_id).filter(Boolean))];
    if (doctorIds.length > 0) {
      const { data: doctors } = await supabase
        .from('doctors')
        .select('user_id, clinic_name, city, state')
        .in('user_id', doctorIds);
      const clinicMap = new Map((doctors || []).map((d: any) => [d.user_id, d]));
      return data.map(j => ({ ...j, clinic: (clinicMap.get(j.doctor_id) as any) || {} }));
    }
    return data.map(j => ({ ...j, clinic: {} }));
  } catch {
    return [];
  }
}

export async function transitionToDoctorAction() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Unauthorized")

  try {
    // 1. Update Profile Role
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'doctor' })
      .eq('id', user.id)

    if (profileError) throw profileError

    // 2. Fetch full name for the doctor record
    const { data: profile } = await supabase
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

    const { error: doctorError } = await supabase
      .from('doctors')
      .upsert({
        user_id: user.id,
        first_name: firstName,
        last_name: lastName,
        slug: slug,
        clinic_name: '',
        bio: '',
        address: '',
        verification_status: 'pending'
      }, { onConflict: 'user_id' })

    if (doctorError) throw doctorError
    
    return { success: true }
  } catch (error) {
    console.error("Failed to transition to doctor:", error)
    return { error: "Failed to transition account." }
  }
}
