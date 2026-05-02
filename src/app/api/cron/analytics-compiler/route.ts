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
 * ANALYTICS COMPILER — Runs every Monday at 7 AM EST
 * Compiles a weekly platform report and emails it to the founder.
 * Shows: total doctors, students, patients, new signups this week,
 * outreach stats, profile completeness, revenue metrics.
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

    // Total counts
    const [doctorsRes, studentsRes, patientsRes, allProfilesRes] = await Promise.all([
      supabase.from('doctors').select('id', { count: 'exact', head: true }).eq('verification_status', 'verified'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient'),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
    ]);

    const totalDoctors = doctorsRes.count || 0;
    const totalStudents = studentsRes.count || 0;
    const totalPatients = patientsRes.count || 0;
    const totalUsers = allProfilesRes.count || 0;

    // New signups this week
    const [newDoctorsRes, newStudentsRes, newPatientsRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'doctor').gte('created_at', oneWeekAgo),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student').gte('created_at', oneWeekAgo),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'patient').gte('created_at', oneWeekAgo),
    ]);

    const newDoctors = newDoctorsRes.count || 0;
    const newStudents = newStudentsRes.count || 0;
    const newPatients = newPatientsRes.count || 0;

    // Outreach stats
    const [outreachTotalRes, outreachContactedRes, outreachSignedUpRes] = await Promise.all([
      supabase.from('outreach_prospects').select('id', { count: 'exact', head: true }),
      supabase.from('outreach_prospects').select('id', { count: 'exact', head: true }).eq('status', 'contacted'),
      supabase.from('outreach_prospects').select('id', { count: 'exact', head: true }).eq('status', 'signed_up'),
    ]);

    const outreachTotal = outreachTotalRes.count || 0;
    const outreachContacted = outreachContactedRes.count || 0;
    const outreachSignedUp = outreachSignedUpRes.count || 0;

    // Incomplete profiles
    const { data: incompleteDocs } = await supabase
      .from('doctors')
      .select('id, photo_url, bio')
      .eq('verification_status', 'verified')
      .not('user_id', 'is', null);

    const missingPhoto = (incompleteDocs || []).filter((d: any) => !d.photo_url).length;
    const missingBio = (incompleteDocs || []).filter((d: any) => !d.bio || d.bio.length < 20).length;
    const profileComplete = (incompleteDocs || []).length - Math.max(missingPhoto, missingBio);

    // Paid vs free doctors
    const { count: paidDoctors } = await supabase
      .from('doctors')
      .select('id', { count: 'exact', head: true })
      .not('user_id', 'is', null)
      .not('membership_tier', 'in', '("starter","free")');

    const freeDoctors = totalDoctors - (paidDoctors || 0);

    // Build the email
    const founderEmail = process.env.FOUNDER_EMAIL || 'ray@neurochiro.co';

    const stat = (label: string, value: number | string, change?: number) => {
      const changeHtml = change !== undefined && change > 0
        ? `<span style="color: #10B981; font-size: 12px; font-weight: 900;">+${change} this week</span>`
        : change !== undefined ? `<span style="color: #9CA3AF; font-size: 12px;">+${change} this week</span>` : '';
      return `<div style="background: #F5F3EF; border-radius: 12px; padding: 16px; text-align: center;">
        <div style="font-size: 28px; font-weight: 900; color: #1E2D3B;">${value}</div>
        <div style="font-size: 11px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin-top: 4px;">${label}</div>
        ${changeHtml ? `<div style="margin-top: 4px;">${changeHtml}</div>` : ''}
      </div>`;
    };

    const body = `
      <h2 style="font-size: 20px; color: #D66829; margin-bottom: 20px;">Weekly Platform Report</h2>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        ${stat('Total Doctors', totalDoctors, newDoctors)}
        ${stat('Total Students', totalStudents, newStudents)}
        ${stat('Total Patients', totalPatients, newPatients)}
        ${stat('Total Users', totalUsers, newDoctors + newStudents + newPatients)}
      </div>

      <h3 style="font-size: 16px; color: #1E2D3B; margin: 24px 0 12px;">Membership</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        ${stat('Paid Doctors', paidDoctors || 0)}
        ${stat('Free Doctors', freeDoctors)}
      </div>

      <h3 style="font-size: 16px; color: #1E2D3B; margin: 24px 0 12px;">Outreach Pipeline</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        ${stat('Total Prospects', outreachTotal)}
        ${stat('Contacted', outreachContacted)}
        ${stat('Signed Up', outreachSignedUp)}
      </div>

      <h3 style="font-size: 16px; color: #1E2D3B; margin: 24px 0 12px;">Profile Health</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px;">
        ${stat('Complete', profileComplete)}
        ${stat('Missing Photo', missingPhoto)}
        ${stat('Missing Bio', missingBio)}
      </div>

      <p style="font-size: 13px; color: #9CA3AF; margin-top: 24px;">Generated automatically by the NeuroChiro Analytics Agent.</p>
    `;

    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: founderEmail,
      subject: `NeuroChiro Weekly Report — ${totalDoctors} doctors, +${newDoctors + newStudents + newPatients} new this week`,
      html: wrapEmail(body),
    });

    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: 'Analytics Compiler: Weekly report sent to founder',
      user_name: 'System',
      target: 'founder',
      status: 'Success',
      severity: 'Low',
      metadata: { totalDoctors, totalStudents, totalPatients, newDoctors, newStudents, newPatients, outreachTotal, outreachContacted, outreachSignedUp },
    });

    return NextResponse.json({ success: true, message: 'Weekly report sent', stats: { totalDoctors, totalStudents, totalPatients } });
  } catch (err: any) {
    console.error('[ANALYTICS COMPILER ERROR]', err);
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
