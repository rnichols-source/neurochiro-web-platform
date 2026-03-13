'use server'

import { createServerSupabase } from '@/lib/supabase-server'

export async function getStudentDashboardData() {
  const supabase = createServerSupabase()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tier, full_name')
      .eq('id', user.id)
      .single()

    const { data: student } = await supabase
      .from('students')
      .select('school, graduation_year')
      .eq('id', user.id)
      .single()

    return {
      profile: {
        name: profile?.full_name?.split(' ')[0] || user.email?.split('@')[0],
        fullName: profile?.full_name,
        role: profile?.role,
        status: (profile?.tier && profile?.tier !== 'free') ? 'active' : 'inactive',
        school: student?.school || "Life University",
        gradYear: student?.graduation_year || "2027"
      },
      stats: {
        readiness: 85,
        applications: 4,
        matchScore: 9.2
      }
    }
  } catch (e) {
    console.error("Student Dashboard Error:", e)
    return null
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
        
    const fullName = profile?.full_name || "New Doctor"
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
        verification_status: 'pending' 
      }, { onConflict: 'user_id' })

    if (doctorError) throw doctorError
    
    return { success: true }
  } catch (error) {
    console.error("Failed to transition to doctor:", error)
    return { error: "Failed to transition account." }
  }
}
