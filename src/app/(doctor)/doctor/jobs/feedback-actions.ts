'use server'

import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function submitFeedback(studentId: string, jobId: string, rating: number, feedbackText: string) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const admin = createAdminClient() as any;
  const { error } = await admin.from('employer_feedback').upsert({
    student_id: studentId,
    doctor_id: user.id,
    job_id: jobId || null,
    rating,
    feedback_text: feedbackText?.slice(0, 1000) || null,
  }, { onConflict: 'doctor_id,student_id,job_id' });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getFeedbackForStudent(studentId: string) {
  const admin = createAdminClient() as any;
  const { data } = await admin
    .from('employer_feedback')
    .select('id, rating, feedback_text, created_at, doctor_id')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  return data || [];
}
