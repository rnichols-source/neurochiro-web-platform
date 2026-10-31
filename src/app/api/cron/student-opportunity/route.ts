import { wrapEmail } from '@/lib/email-template';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseSecretKey } from '@/lib/supabase-secret';
import { SUPABASE_URL } from '@/lib/supabase-env';
import { Resend } from 'resend';
import { deriveStudentMembership } from '@/lib/students/membership-pure';
import { missingSchema } from '@/lib/students/schema';
import { digestMonth, escapeHtml, receivesMonthlyDigest } from '@/lib/jobs/posting-pure';

export const maxDuration = 300;

const getSupabase = () => createClient(
  SUPABASE_URL,
  getSupabaseSecretKey(),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const getResend = () => new Resend(process.env.RESEND_API_KEY || '');

/**
 * Monthly student digest. Schedule is 0 13 1 * * (13:00 UTC on the 1st).
 * The path stays /api/cron/student-opportunity so the cron list does not change.
 * It used to run every Wednesday and email every role=student.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const supabase = getSupabase();
    const resend = getResend();
    const now = new Date();
    const month = digestMonth(now.toISOString());
    const monthStart = `${month}-01T00:00:00.000Z`;

    const probe = await (supabase as any).from('student_email_sends').select('user_id').limit(1);
    if (probe.error && missingSchema(probe.error)) {
      return NextResponse.json({ success: false, message: 'student_email_sends is not ready', sent: 0 });
    }

    const featuredQuery = await (supabase as any)
      .from('job_postings')
      .select('title, clinic_name, city, state, featured_until')
      .in('status', ['Active', 'open'])
      .gt('featured_until', now.toISOString())
      .limit(5);
    const featured = featuredQuery.error ? [] : (featuredQuery.data || []);

    const newQuery = await (supabase as any)
      .from('job_postings')
      .select('title, clinic_name, city, state, created_at')
      .in('status', ['Active', 'open'])
      .gte('created_at', monthStart)
      .limit(5);
    const fresh = newQuery.error ? [] : (newQuery.data || []);

    const callQuery = await (supabase as any)
      .from('student_calls')
      .select('starts_at, topic')
      .eq('status', 'scheduled')
      .gt('starts_at', now.toISOString())
      .order('starts_at', { ascending: true })
      .limit(1);
    const nextCall = callQuery.error ? null : callQuery.data?.[0];

    let studentsQuery = await (supabase as any)
      .from('profiles')
      .select('id, email, full_name, role, tier, created_at, student_past_due_since')
      .eq('role', 'student');
    if (studentsQuery.error && missingSchema(studentsQuery.error)) {
      studentsQuery = await (supabase as any).from('profiles').select('id, email, full_name, role, tier, created_at').eq('role', 'student');
    }
    const students = (studentsQuery.data || []).filter((row: { role?: string; tier?: string; created_at?: string; student_past_due_since?: string | null }) => {
      const membership = deriveStudentMembership({
        role: row.role,
        tier: row.tier,
        createdAt: row.created_at,
        pastDueSince: row.student_past_due_since,
        now: now.toISOString(),
      });
      return receivesMonthlyDigest(membership.status);
    });

    const card = (row: { title?: string; clinic_name?: string; city?: string; state?: string }) =>
      `<div style="background:#F5F3EF;border-radius:10px;padding:12px 16px;margin-bottom:8px;"><strong>${escapeHtml(row.title || 'Associateship')}</strong><br><span>${escapeHtml([row.clinic_name, row.city, row.state].filter(Boolean).join(' · '))}</span></div>`;

    let sent = 0;
    for (const student of students) {
      if (!student.email || !student.id) continue;
      const inserted = await (supabase as any).from('student_email_sends').insert({
        month,
        user_id: student.id,
        kind: 'monthly_digest',
      });
      if (inserted.error) continue;

      const { data: studentRow } = await (supabase as any).from('students').select('state, location_city').eq('id', student.id).maybeSingle();
      let shadowNote = '';
      if (studentRow?.state) {
        const { data: doctors } = await (supabase as any)
          .from('doctors')
          .select('clinic_name, city, state')
          .eq('offers_shadowing', true)
          .eq('state', studentRow.state)
          .limit(3);
        if (doctors?.length) {
          shadowNote = `<h3>Doctors open to shadowing in ${escapeHtml(studentRow.state)}</h3>${doctors.map((doctor: { clinic_name?: string; city?: string; state?: string }) => card({ title: doctor.clinic_name, city: doctor.city, state: doctor.state })).join('')}`;
        }
      }

      const callNote = nextCall
        ? `<p>Next mentorship call: ${escapeHtml(nextCall.topic || 'Monthly call')} on ${escapeHtml(new Date(nextCall.starts_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }))}.</p>`
        : '<p>The next mentorship call is not on the calendar yet.</p>';

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: student.email,
          subject: 'Associateships and the monthly call',
          html: wrapEmail(`
            <p>Hi ${escapeHtml(student.full_name?.split(' ')[0] || 'there')},</p>
            <h3>Featured associateships</h3>
            ${featured.length ? featured.map(card).join('') : '<p>No featured posts this month.</p>'}
            <h3>New this month</h3>
            ${fresh.length ? fresh.map(card).join('') : '<p>No new posts yet this month.</p>'}
            ${callNote}
            ${shadowNote}
            <p><a href="https://neurochiro.co/jobs">See associateships</a></p>
          `),
        });
        sent += 1;
      } catch {
        console.error('[STUDENT OPPORTUNITY] Send failed');
      }
    }

    return NextResponse.json({ success: true, message: `Monthly digest: ${sent} sent`, sent });
  } catch (err: unknown) {
    console.error('[STUDENT OPPORTUNITY ERROR]');
    const message = err instanceof Error ? err.message : 'Digest failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
