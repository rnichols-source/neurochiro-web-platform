"use server";

import { createServerSupabase } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { Automations } from '@/lib/automations';


/**
 * 1. JOB POSTINGS ACTIONS
 */
export async function getJobPostings() {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('job_postings')
    .select(`
      *,
      applications:applications(count)
    `)
    .eq('doctor_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching job postings:", error);
    return [];
  }

  return data;
}

export async function createJobPosting(formData: any) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('job_postings')
    .insert({
      doctor_id: user.id,
      title: formData.title,
      description: formData.description,
      type: formData.type || 'Associate',
      salary_min: formData.salary_min,
      salary_max: formData.salary_max,
      benefits: formData.benefits || [],
      requirements: formData.requirements || [],
      status: 'Active'
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating job posting:", error);
    throw new Error("Failed to create job posting");
  }

  revalidatePath('/doctor/jobs');
  return { success: true, data };
}

/**
 * 2. PIPELINE / APPLICATIONS ACTIONS
 */
export async function getApplications(jobId?: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  let query = supabase
    .from('applications')
    .select(`
      *,
      job:job_postings!inner(title, doctor_id),
      candidate:students!inner(
        user_id,
        full_name,
        school,
        graduation_year,
        skills,
        resume_url
      )
    `);

  if (jobId) {
    query = query.eq('job_id', jobId);
  } else {
    query = query.eq('job_postings.doctor_id', user.id);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching applications:", error);
    return [];
  }

  // Transform to match UI expectations
  return (data || []).map((app: any) => ({
    id: app.id,
    jobId: app.job_id,
    jobTitle: app.job.title,
    candidateId: app.candidate_id,
    name: app.candidate.full_name || 'Anonymous Candidate',
    school: app.candidate.school,
    gradYear: app.candidate.graduation_year,
    stage: app.stage,
    skills: app.candidate.skills || [],
    resumeUrl: app.candidate.resume_url,
    appliedAt: app.created_at
  }));
}

export async function updateApplicationStage(applicationId: string, stage: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data, error } = await supabase
    .from('applications')
    .update({ stage, updated_at: new Date().toISOString() })
    .eq('id', applicationId)
    .select()
    .single();

  if (error) {
    console.error("Error updating application stage:", error);
    throw new Error("Failed to update stage");
  }

  // If stage is 'Interview', we can trigger an automation
  if (stage === 'Interview') {
    const { data: candidateProfile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', data.candidate_id)
        .single();
    
    if (candidateProfile?.email) {
        // Trigger Resend email logic here
    }
  }

  revalidatePath('/doctor/jobs');
  return { success: true };
}

/**
 * 3. MARKET PULSE & SCORING
 */
export async function getMarketBenchmarks(roleType: string = 'Associate', regionCode: string = 'DEFAULT') {
  const supabase = createServerSupabase();
  
  const { data, error } = await supabase
    .from('market_benchmarks')
    .select('*')
    .eq('role_type', roleType)
    .eq('region_code', regionCode)
    .single();

  if (error) {
    // Try to get default if region specific not found
    const { data: defaultData } = await supabase
      .from('market_benchmarks')
      .select('*')
      .eq('role_type', roleType)
      .eq('region_code', 'DEFAULT')
      .single();
    
    return defaultData || (roleType === 'Associate' 
        ? { avg_salary_min: 75000, avg_salary_max: 120000, common_benefits: ["Health Insurance", "Malpractice"] }
        : { avg_salary_min: 35000, avg_salary_max: 55000, common_benefits: ["Health Insurance", "Paid Time Off"] });
  }

  return data;
}

/**
 * 4. TALENT RECOMMENDATIONS & SMART MATCH
 */
export async function getTalentRecommendations(jobId: string) {
  const supabase = createServerSupabase();
  
  // 1. Get Job Requirements
  const { data: job } = await supabase
    .from('job_postings')
    .select('requirements, type')
    .eq('id', jobId)
    .single();

  if (!job) return [];

  const jobRequirements = job.requirements || [];

  // 2. Get Candidates (filtering by type if relevant, here using students as potential Associates)
  const { data: candidates, error } = await supabase
    .from('students')
    .select(`
        user_id,
        full_name,
        school,
        graduation_year,
        skills
    `)
    .limit(10);

  if (error) return [];

  // 3. Real Skill Matching Algorithm
  return (candidates || []).map((c: any) => {
    const candidateSkills = c.skills || [];
    let matchCount = 0;
    
    if (jobRequirements.length > 0) {
      jobRequirements.forEach((req: string) => {
        if (candidateSkills.some((skill: string) => skill.toLowerCase().includes(req.toLowerCase()))) {
          matchCount++;
        }
      });
    }

    const matchScore = jobRequirements.length > 0 
      ? Math.round((matchCount / jobRequirements.length) * 100)
      : Math.floor(Math.random() * 20) + 70; // Fallback for demo if no requirements

    return {
      id: c.user_id,
      name: c.full_name || 'Anonymous',
      school: c.school,
      gradYear: c.graduation_year,
      matchScore: Math.max(matchScore, 65), // ensure a baseline for demo
      topSkills: candidateSkills.slice(0, 3)
    };
  }).sort((a: any, b: any) => b.matchScore - a.matchScore);
}

export async function generateDreamPitch(candidateId: string, jobId: string) {
  const supabase = createServerSupabase();
  
  const [candidateRes, jobRes] = await Promise.all([
    supabase.from('students').select('*').eq('user_id', candidateId).single(),
    supabase.from('job_postings').select('*').eq('id', jobId).single()
  ]);

  const candidate = candidateRes.data;
  const job = jobRes.data;

  if (!candidate || !job) return "Failed to generate pitch. Missing data.";

  // Fetch the doctor's clinic name
  const { data: doctor } = await supabase
    .from('doctors')
    .select('clinic_name')
    .eq('user_id', job.doctor_id)
    .single();

  const firstName = candidate.full_name?.split(' ')[0] || 'Doctor';
  const school = candidate.school || 'your chiropractic college';
  const clinic = doctor?.clinic_name || 'our practice';
  const title = job.title;

  // Simulate Gemini prompt response
  const pitch = `Hi ${firstName}, 

I've been following your progress at ${school} and I'm genuinely impressed by your commitment to nervous-system-first care. 

We're currently looking for a ${title} at ${clinic}, and your expertise in ${candidate.skills?.slice(0, 2).join(' and ') || 'clinical excellence'} caught our eye. We've built a culture here that prioritizes objective clinical certainty, and I think you'd be a perfect fit to lead our new patient onboarding.

Are you open to a brief 15-minute clinical deep dive this week? I'd love to share the vision for what we're building.

Best,
The ${clinic} Team`;

  return pitch;
}
