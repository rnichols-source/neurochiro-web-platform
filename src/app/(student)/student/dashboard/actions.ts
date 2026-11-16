'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'
import { canTransitionStudentToDoctor } from '@/lib/security/role-transition'
import { loadStudentProfile } from '@/lib/students/save-student-profile'

export async function getStudentDashboardData() {
  const supabase = createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, tier, full_name, stripe_customer_id')
      .eq('id', user.id)
      .single()

    const loaded = await loadStudentProfile(user.id)
    const student = loaded.data

    const { count: applicationsCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', user.id)

    let readiness = 20
    if (student?.school) readiness += 20
    if (student?.graduationYear) readiness += 20
    if (student?.city) readiness += 20
    if (student?.techniques && student.techniques.length > 0) readiness += 20

    const account = profile as { full_name?: string | null; role?: string | null; tier?: string | null; stripe_customer_id?: string | null } | null
    const fullName = account?.full_name || student?.fullName || ''
    return {
      profile: {
        name: fullName.split(' ')[0] || user.email?.split('@')[0],
        fullName,
        role: account?.role || student?.role,
        status: (account?.tier && account.tier !== 'free') ? 'active' : 'inactive',
        hasSubscription: !!account?.stripe_customer_id,
        school: student?.school || null,
        gradYear: student?.graduationYear || null,
        city: student?.city || null,
        state: student?.state || null,
        yearInSchool: student?.yearInSchool || null,
        interests: student?.techniques || [],
        skills: student?.techniques || [],

      },
      stats: {
        readiness,
        applications: applicationsCount || 0,
        matchScore: student?.city ? 9.2 : 0
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
  // 6 courses: ns-foundations(4) + neuroplasticity(4) + clinical-identity(4) + business(6) + clinical-confidence(6) + associate-playbook(4) = 28
  if (!user) return { completed: 0, total: 28 }

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

  // 6 courses: ns-foundations(4) + neuroplasticity(4) + clinical-identity(4) + business(6) + clinical-confidence(6) + associate-playbook(4) = 28
  return { completed, total: 28 }
}

export async function getCareerReadinessData() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const loaded = await loadStudentProfile(user.id)
    const s = loaded.data
    let profileScore = 0
    if (s?.fullName) profileScore += 15
    if (s?.school) profileScore += 15
    if (s?.graduationYear) profileScore += 15
    if (s?.city) profileScore += 15
    if (s?.yearInSchool) profileScore += 15
    if (s?.techniques && s.techniques.length > 0) profileScore += 15
    if (s?.state) profileScore += 10
    profileScore = Math.min(profileScore, 100)

    // Academy progress (25%)
    const { data: courseData } = await supabase
      .from('course_progress')
      .select('completed_modules')
      .eq('user_id', user.id)
    let totalModulesCompleted = 0
    if (courseData) {
      courseData.forEach(row => {
        const mods = Array.isArray(row.completed_modules) ? row.completed_modules : []
        totalModulesCompleted += mods.length
      })
    }
    const academyScore = Math.min(Math.round((totalModulesCompleted / 28) * 100), 100)

    // Job applications (20%)
    const { count: appCount } = await supabase
      .from('job_applications')
      .select('*', { count: 'exact', head: true })
      .eq('applicant_id', user.id)
    const appsSubmitted = appCount || 0
    const jobScore = Math.min(appsSubmitted * 20, 100)

    // Contract reviews (10%)
    const { count: contractCount } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    const contractScore = (contractCount || 0) > 0 ? 100 : 0

    // Financial plan (10%)
    const { data: planData } = await (supabase as any)
      .from('financial_plans')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()
    const financialScore = planData ? 100 : 0

    // Interview prep (15%) — check if they've used the interview prep page
    // We'll use a simple heuristic: if they have any course progress in clinical confidence or associate playbook
    const interviewScore = totalModulesCompleted >= 10 ? 100 : totalModulesCompleted >= 5 ? 50 : 0

    // Weighted total
    const totalScore = Math.round(
      profileScore * 0.20 +
      academyScore * 0.25 +
      interviewScore * 0.15 +
      jobScore * 0.20 +
      contractScore * 0.10 +
      financialScore * 0.10
    )

    return {
      totalScore,
      breakdown: {
        profile: { score: profileScore, weight: 20, label: "Profile" },
        academy: { score: academyScore, weight: 25, label: "Academy" },
        interview: { score: interviewScore, weight: 15, label: "Interview Prep" },
        jobs: { score: jobScore, weight: 20, label: "Job Applications" },
        contract: { score: contractScore, weight: 10, label: "Contract Review" },
        financial: { score: financialScore, weight: 10, label: "Financial Plan" },
      },
      milestones: {
        profileComplete: profileScore >= 80,
        firstCourseStarted: totalModulesCompleted > 0,
        firstCourseCompleted: (courseData || []).some(row => {
          const mods = Array.isArray(row.completed_modules) ? row.completed_modules : []
          return mods.length >= 3
        }),
        firstJobApp: appsSubmitted > 0,
        contractReviewed: (contractCount || 0) > 0,
        financialPlanCreated: !!planData,
        allCoursesComplete: totalModulesCompleted >= 28,
      },
      raw: {
        modulesCompleted: totalModulesCompleted,
        appsSubmitted,
        contractsReviewed: contractCount || 0,
      }
    }
  } catch (e) {
    console.error("Career Readiness Error:", e)
    return null
  }
}

export async function getMatchedJobsCount() {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 0

  try {
    const { count } = await supabase
      .from('job_postings')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'open')
    return count || 0
  } catch {
    return 0
  }
}

export async function getJobsForRadar() {
  const supabase = createServerSupabase()

  try {
    const { data: jobs, error } = await supabase
      .from('job_postings')
      .select('*')
      .eq('status', 'open')
      .limit(5);

    if (error) throw error;
    return jobs || [];
  } catch (e) {
    console.error("Error fetching jobs for radar:", e);
    return [];
  }
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

  if (!user) return { error: "Unauthorized" }

  try {
    // 0. Verify user is currently a student
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!currentProfile || !canTransitionStudentToDoctor(currentProfile.role)) {
      return { error: "Only student accounts can transition to doctor." }
    }

    const admin = createAdminClient()
    const { error: profileError } = await admin
      .from('profiles')
      .update({ role: 'doctor' })
      .eq('id', user.id)

    if (profileError) throw profileError

    const { data: profile } = await admin
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

    const { error: doctorError } = await admin
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
