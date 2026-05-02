import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export const maxDuration = 300;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const getResend = () => new Resend(process.env.RESEND_API_KEY || '');

/**
 * STUDENT OPPORTUNITY — Runs every Wednesday at 9 AM EST
 * Checks for new job postings and seminars added in the last 7 days.
 * Sends a digest to all students so they don't miss opportunities.
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
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get new jobs this week
    const { data: newJobs, count: jobCount } = await supabase
      .from('jobs')
      .select('title, clinic_name, city, state', { count: 'exact' })
      .gte('created_at', oneWeekAgo)
      .eq('status', 'active')
      .limit(5);

    // Get new seminars this week
    const { data: newSeminars, count: seminarCount } = await supabase
      .from('seminars')
      .select('title, location, date', { count: 'exact' })
      .gte('created_at', oneWeekAgo)
      .eq('status', 'approved')
      .limit(5);

    const totalNew = (jobCount || 0) + (seminarCount || 0);
    if (totalNew === 0) {
      return NextResponse.json({ success: true, message: 'No new opportunities this week', sent: 0 });
    }

    // Get all students
    const { data: students } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('role', 'student');

    if (!students || students.length === 0) {
      return NextResponse.json({ success: true, message: 'No students to email', sent: 0 });
    }

    // Build job list HTML
    const jobsHtml = (newJobs || []).length > 0
      ? `<h3 style="font-size: 16px; color: #D66829; margin: 20px 0 12px;">New Jobs (${jobCount})</h3>
         ${(newJobs as any[]).map(j => `<div style="background: #F5F3EF; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;">
           <strong style="color: #1E2D3B;">${j.title}</strong><br>
           <span style="font-size: 13px; color: #4B5563;">${j.clinic_name} — ${j.city}, ${j.state}</span>
         </div>`).join('')}`
      : '';

    const seminarsHtml = (newSeminars || []).length > 0
      ? `<h3 style="font-size: 16px; color: #D66829; margin: 20px 0 12px;">New Seminars (${seminarCount})</h3>
         ${(newSeminars as any[]).map(s => `<div style="background: #F5F3EF; border-radius: 10px; padding: 12px 16px; margin-bottom: 8px;">
           <strong style="color: #1E2D3B;">${s.title}</strong><br>
           <span style="font-size: 13px; color: #4B5563;">${s.location} — ${s.date ? new Date(s.date).toLocaleDateString() : 'TBD'}</span>
         </div>`).join('')}`
      : '';

    const CHUNK_SIZE = 100;
    let sent = 0;

    for (let i = 0; i < students.length; i += CHUNK_SIZE) {
      const chunk = students.slice(i, i + CHUNK_SIZE);
      const emails = chunk.map((s: any) => ({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: s.email,
        subject: `${totalNew} new opportunities this week on NeuroChiro`,
        html: wrapEmail(`
          <p>Hi ${s.full_name?.split(' ')[0] || 'Student'},</p>
          <p>Here's what's new on NeuroChiro this week:</p>
          ${jobsHtml}
          ${seminarsHtml}
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/student/jobs" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px;">Browse All Opportunities</a></p>
        `),
      }));

      try {
        await resend.batch.send(emails);
        sent += emails.length;
      } catch (err) {
        console.error('[STUDENT OPPORTUNITY] Batch failed:', err);
      }
    }

    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Student Opportunity: ${sent} digests sent (${jobCount} jobs, ${seminarCount} seminars)`,
      user_name: 'System',
      target: 'all_students',
      status: 'Success',
      severity: 'Low',
      metadata: { sent, jobCount, seminarCount },
    });

    return NextResponse.json({ success: true, message: `Student Opportunity: ${sent} digests sent`, sent });
  } catch (err: any) {
    console.error('[STUDENT OPPORTUNITY ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function wrapEmail(body: string) {
  return `<!DOCTYPE html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
    <style>body{font-family:'Lato',Helvetica,Arial,sans-serif;margin:0;padding:0;background:#FCF9F5;}
    .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);border:1px solid #E5E7EB;}
    .header{background:#1E2D3B;padding:30px;text-align:center;}
    .content{padding:40px;color:#1E2D3B;font-size:16px;line-height:1.7;}
    .footer{text-align:center;padding:30px;font-size:11px;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;font-weight:700;}</style>
    </head><body><div class="wrapper">
    <div class="header"><img src="https://neurochiro.co/logo-white.png" alt="NeuroChiro" width="120" style="display:block;margin:0 auto;"></div>
    <div class="content">${body}</div>
    <div class="footer">&copy; 2026 NeuroChiro Network</div>
    </div></body></html>`;
}
