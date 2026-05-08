'use server'

import { createAdminClient } from '@/lib/supabase-admin'
import { computeChiroScore, type ChiroScoreResult } from '@/lib/chiroscore'

export async function getChiroScoreForCandidate(studentId: string): Promise<ChiroScoreResult | null> {
  try {
    const sb = createAdminClient() as any;

    const [studentRes, profileRes, certsRes, courseRes, financialRes, contractRes, seminarsRes, appsRes, interviewsRes, feedbackRes] = await Promise.all([
      sb.from('students').select('full_name, school, graduation_year, location_city, interests, skills, resume_url').eq('id', studentId).maybeSingle(),
      sb.from('profiles').select('avatar_url').eq('id', studentId).single(),
      sb.from('student_certifications').select('id, verified').eq('student_id', studentId),
      sb.from('course_progress').select('completed_modules').eq('user_id', studentId),
      sb.from('financial_plans').select('id', { count: 'exact', head: true }).eq('user_id', studentId),
      sb.from('contracts').select('id', { count: 'exact', head: true }).eq('user_id', studentId),
      sb.from('seminar_registrations').select('id', { count: 'exact', head: true }).eq('user_id', studentId),
      sb.from('job_applications').select('id', { count: 'exact', head: true }).eq('applicant_id', studentId),
      sb.from('applications').select('id', { count: 'exact', head: true }).eq('candidate_id', studentId).in('stage', ['Phone Screen', 'Interview', 'Offer', 'Hired']),
      sb.from('employer_feedback').select('rating').eq('student_id', studentId),
    ]);

    const student = studentRes.data;
    const certs = certsRes.data || [];
    const courses = courseRes.data || [];

    let totalModulesCompleted = 0;
    for (const c of courses) {
      const modules = c.completed_modules;
      if (Array.isArray(modules)) totalModulesCompleted += modules.length;
    }

    const feedbackData = feedbackRes.data || [];
    const avgRating = feedbackData.length > 0
      ? feedbackData.reduce((sum: number, f: any) => sum + (f.rating || 0), 0) / feedbackData.length
      : 0;

    return computeChiroScore({
      profile: {
        fullName: student?.full_name || null,
        school: student?.school || null,
        graduationYear: student?.graduation_year || null,
        locationCity: student?.location_city || null,
        interests: student?.interests || null,
        skills: student?.skills || null,
        resumeUrl: student?.resume_url || null,
        avatarUrl: profileRes.data?.avatar_url || null,
      },
      certifications: { count: certs.length, verifiedCount: certs.filter((c: any) => c.verified).length },
      academy: { completedModules: totalModulesCompleted, totalModules: 28 },
      career: { hasFinancialPlan: (financialRes.count || 0) > 0, hasContract: (contractRes.count || 0) > 0, interviewPrepModules: totalModulesCompleted },
      community: { seminarsAttended: seminarsRes.count || 0 },
      jobMarket: { applicationsSubmitted: appsRes.count || 0, interviewsReached: interviewsRes.count || 0 },
      employerRatings: { avgRating, count: feedbackData.length },
    });
  } catch (err) {
    console.error('ChiroScore candidate error:', err);
    return null;
  }
}
