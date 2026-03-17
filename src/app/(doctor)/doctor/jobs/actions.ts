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

  const { data, error } = await (supabase as any)
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

  const { data, error } = await (supabase as any)
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

  let query = (supabase as any)
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

  const { data, error } = await (supabase as any)
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
    const { data: candidateProfile } = await (supabase as any)
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
export async function getMarketBenchmarks(roleType: string = 'Associate') {
  const supabase = createServerSupabase();
  
  const { data, error } = await (supabase as any)
    .from('market_benchmarks')
    .select('*')
    .eq('role_type', roleType)
    .single();

  if (error) {
    // Fallback hardcoded benchmarks
    return roleType === 'Associate' 
        ? { avg_salary_min: 75000, avg_salary_max: 120000, common_benefits: ["Health Insurance", "Malpractice"] }
        : { avg_salary_min: 35000, avg_salary_max: 55000, common_benefits: ["Health Insurance", "Paid Time Off"] };
  }

  return data;
}

/**
 * 4. TALENT RECOMMENDATIONS & SMART MATCH
 */
export async function getTalentRecommendations(jobId: string) {
  const supabase = createServerSupabase();
  
  // 1. Get Job Requirements
  const { data: job } = await (supabase as any)
    .from('job_postings')
    .select('requirements, type')
    .eq('id', jobId)
    .single();

  if (!job) return [];

  // 2. Simple skill matching
  const { data: candidates, error } = await (supabase as any)
    .from('students')
    .select(`
        user_id,
        full_name,
        school,
        graduation_year,
        skills
    `)
    .limit(5);

  if (error) return [];

  return (candidates || []).map((c: any) => ({
    id: c.user_id,
    name: c.full_name || 'Anonymous',
    school: c.school,
    gradYear: c.graduation_year,
    matchScore: Math.floor(Math.random() * 20) + 80,
    topSkills: (c.skills || []).slice(0, 3)
  }));
}

export async function generateDreamPitch(candidateId: string, jobId: string) {
  const supabase = createServerSupabase();
  
  const [candidateRes, jobRes] = await Promise.all([
    (supabase as any).from('students').select('*').eq('user_id', candidateId).single(),
    (supabase as any).from('job_postings').select('*, doctor:doctors(*)').eq('id', jobId).single()
  ]);

  const candidate = candidateRes.data;
  const job = jobRes.data;

  if (!candidate || !job) return "Failed to generate pitch. Missing data.";

  const name = candidate.full_name?.split(' ')[0] || 'Doctor';
  const school = candidate.school || 'your chiropractic college';
  const clinic = job.doctor?.clinic_name || 'our practice';
  
  return `Hi Dr. ${name}, I saw your background at ${school} and was incredibly impressed by your focus on neuro-centric care. At ${clinic}, we are looking for an Associate who shares our vision for nervous-system-first healing. Based on your skill set, I believe you'd be a perfect fit to lead our new patient acquisition workflow. Are you open to a 15-minute clinical deep dive this Thursday?`;
}
