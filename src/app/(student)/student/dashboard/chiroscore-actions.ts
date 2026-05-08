'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { computeChiroScore, type ChiroScoreResult } from '@/lib/chiroscore'

export async function getChiroScore(): Promise<ChiroScoreResult | null> {
  const supabase = createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  try {
    const sb = supabase as any;

    // Fetch all data in parallel
    const [
      profileRes,
      studentRes,
      certsRes,
      courseRes,
      financialRes,
      contractRes,
      seminarsRes,
      appsRes,
      interviewsRes,
      feedbackRes,
    ] = await Promise.all([
      // Profile (avatar)
      supabase.from('profiles').select('avatar_url').eq('id', user.id).single(),
      // Student data
      supabase.from('students').select('full_name, school, graduation_year, location_city, interests, skills, resume_url').eq('id', user.id).maybeSingle(),
      // Certifications
      sb.from('student_certifications').select('id, verified').eq('student_id', user.id),
      // Course progress
      supabase.from('course_progress').select('completed_modules').eq('user_id', user.id),
      // Financial plan
      sb.from('financial_plans').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      // Contract review
      sb.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      // Seminar registrations
      supabase.from('seminar_registrations').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      // Job applications
      supabase.from('job_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', user.id),
      // Interviews reached (applications that advanced past "New" stage)
      sb.from('applications').select('id', { count: 'exact', head: true }).eq('candidate_id', user.id).in('stage', ['Phone Screen', 'Interview', 'Offer', 'Hired']),
      // Employer feedback
      sb.from('employer_feedback').select('rating').eq('student_id', user.id),
    ]);

    const student = studentRes.data;
    const profile = profileRes.data;
    const certs = certsRes.data || [];
    const courses = courseRes.data || [];

    // Count completed modules across all courses
    let totalModulesCompleted = 0;
    for (const c of courses) {
      const modules = c.completed_modules;
      if (Array.isArray(modules)) totalModulesCompleted += modules.length;
    }

    // Calculate employer rating average
    const feedbackData = feedbackRes.data || [];
    const avgRating = feedbackData.length > 0
      ? feedbackData.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedbackData.length
      : 0;

    const result = computeChiroScore({
      profile: {
        fullName: student?.full_name || null,
        school: student?.school || null,
        graduationYear: student?.graduation_year || null,
        locationCity: student?.location_city || null,
        interests: student?.interests || null,
        skills: student?.skills || null,
        resumeUrl: student?.resume_url || null,
        avatarUrl: profile?.avatar_url || null,
      },
      certifications: {
        count: certs.length,
        verifiedCount: certs.filter((c: any) => c.verified).length,
      },
      academy: {
        completedModules: totalModulesCompleted,
        totalModules: 28,
      },
      career: {
        hasFinancialPlan: (financialRes.count || 0) > 0,
        hasContract: (contractRes.count || 0) > 0,
        interviewPrepModules: totalModulesCompleted,
      },
      community: {
        seminarsAttended: seminarsRes.count || 0,
      },
      jobMarket: {
        applicationsSubmitted: appsRes.count || 0,
        interviewsReached: interviewsRes.count || 0,
      },
      employerRatings: {
        avgRating,
        count: feedbackData.length,
      },
    });

    return result;
  } catch (err) {
    console.error('ChiroScore error:', err);
    return null;
  }
}
