'use server';

import { hasMemberAccess } from '@/lib/students/membership-pure';
import { getStudentMembership } from '@/lib/students/membership';
import { createAdminClient } from '@/lib/supabase-admin';
import { createServerSupabase } from '@/lib/supabase-server';
import { missingSchema } from '@/lib/students/schema';
import { Resend } from 'resend';
import { escapeHtml } from '@/lib/jobs/posting-pure';

export async function applyAsMember(jobId: string, formData: FormData) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Join as a student to apply.' };
  const membership = await getStudentMembership(user.id);
  if (!hasMemberAccess(membership)) return { error: 'Membership is required to apply.' };

  const name = String(formData.get('name') || '').trim();
  const message = String(formData.get('message') || '').trim();
  if (!name) return { error: 'Name is required.' };

  const admin = createAdminClient();
  let resumeUrl: string | null = null;
  const file = formData.get('resume');
  if (file instanceof File && file.size > 0) {
    if (file.size > 5 * 1024 * 1024) return { error: 'Resume must be 5 MB or smaller.' };
    const safe = file.name.replace(/[^a-zA-Z0-9.]+/g, '-').slice(0, 80);
    const path = `${user.id}/${jobId}-${safe}`;
    const bytes = new Uint8Array(await file.arrayBuffer());
    const uploaded = await admin.storage.from('student-resumes').upload(path, bytes, {
      contentType: file.type || 'application/octet-stream',
      upsert: true,
    });
    if (!uploaded.error) resumeUrl = `student-resumes/${path}`;
  }

  const row = {
    job_id: jobId,
    applicant_id: user.id,
    student_user_id: user.id,
    applicant_name: name,
    applicant_email: user.email,
    message: message || null,
    stage: 'new',
    resume_url: resumeUrl,
    updated_at: new Date().toISOString(),
  };
  let inserted = await (admin as any).from('job_applications').insert(row);
  if (inserted.error && missingSchema(inserted.error)) {
    const { student_user_id, stage, resume_url, updated_at, ...base } = row;
    void student_user_id; void stage; void resume_url; void updated_at;
    inserted = await (admin as any).from('job_applications').insert(base);
  }
  if (inserted.error) {
    if (inserted.error.code === '23505') return { error: "You've already applied for this position." };
    console.error('Member apply failed', inserted.error.code);
    return { error: 'Failed to submit the application.' };
  }

  const { data: job } = await admin.from('job_postings').select('doctor_id, title').eq('id', jobId).maybeSingle();
  if (job?.doctor_id) {
    const { data: doctor } = await admin.from('profiles').select('email').eq('id', job.doctor_id).maybeSingle();
    const title = escapeHtml(job.title || 'your associateship');
    if (doctor?.email) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY || '');
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: [doctor.email],
          subject: `New applicant for ${job.title || 'your associateship'}`,
          html: `<p>A student applied for ${title}.</p><p><a href="https://neurochiro.co/doctor/jobs">Open your hiring page</a> to read it.</p>`,
        });
      } catch {
        console.error('[JOBS] Applicant email failed');
      }
    }
    await admin.from('notifications').insert({
      user_id: job.doctor_id,
      title: 'New applicant',
      body: `A student applied for ${job.title || 'your associateship'}.`,
      type: 'job_application',
      link: '/doctor/jobs',
    });
  }

  return { ok: true };
}
