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
 * CHURN PREVENTER — Runs daily at 6 AM EST
 * Detects doctors who:
 * - Had a payment failure (subscription_status changed to past_due)
 * - Haven't logged in for 30+ days
 * - Downgraded from paid to free
 * Sends retention emails to re-engage them.
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
    let sent = 0;

    // Check for existing churn prevention emails to avoid duplicates
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentChurn } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'churn_prevention')
      .gte('created_at', sevenDaysAgo);

    const recentlyEmailed = new Set(
      (recentChurn || []).map((c: any) => c.payload?.userId)
    );

    // 1. Find doctors with past_due or inactive subscription who were previously paid
    const { data: atRiskDocs } = await supabase
      .from('profiles')
      .select('id, email, full_name, subscription_status, updated_at')
      .eq('role', 'doctor')
      .in('subscription_status', ['past_due', 'canceled', 'unpaid']);

    for (const doc of (atRiskDocs || []) as any[]) {
      if (recentlyEmailed.has(doc.id)) continue;

      const name = doc.full_name?.split(' ')[0] || 'Doctor';

      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: doc.email,
        subject: `Dr. ${name}, your NeuroChiro access needs attention`,
        html: wrapEmail(`
          <p>Hi Dr. ${name},</p>
          <p>We noticed there's an issue with your NeuroChiro subscription. Your access to premium tools (messaging, analytics, KPI tracker, and more) may be interrupted.</p>
          <p>We don't want you to lose what you've built. Your patients are still finding you in the directory — let's make sure you can keep connecting with them.</p>
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/billing" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">Update Billing</a></p>
          <p style="margin-top: 16px; font-size: 13px; color: #9CA3AF;">If you need help or have questions, reply to this email. I read every message personally.</p>
          <p style="margin-top: 20px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `),
      });

      await supabase.from('automation_queue').insert({
        event_type: 'churn_prevention',
        payload: { userId: doc.id, email: doc.email, reason: doc.subscription_status },
        status: 'completed',
      });

      sent++;
    }

    // Track who we already emailed in this run to prevent duplicates
    const emailedThisRun = new Set((atRiskDocs || []).map((d: any) => d.id));

    // 2. Find doctors who haven't logged in for 30+ days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data: allDoctors } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .eq('role', 'doctor')
      .lt('updated_at', thirtyDaysAgo);

    for (const doc of (allDoctors || []) as any[]) {
      if (recentlyEmailed.has(doc.id) || emailedThisRun.has(doc.id)) continue;

      const name = doc.full_name?.split(' ')[0] || 'Doctor';

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: doc.email,
          subject: `We miss you, Dr. ${name}`,
          html: wrapEmail(`
            <p>Hi Dr. ${name},</p>
            <p>It's been a while since you logged into NeuroChiro. Your profile is still live and patients are still finding you — but there might be messages, analytics, or updates waiting for you.</p>
            <p>Just wanted to check in and make sure everything is good.</p>
            <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/dashboard" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">Go to Dashboard</a></p>
            <p style="margin-top: 20px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
          `),
        });

        await supabase.from('automation_queue').insert({
          event_type: 'churn_prevention',
          payload: { userId: doc.id, email: doc.email, reason: 'inactive_30_days' },
          status: 'completed',
        });

        sent++;
      } catch (err) {
        console.error(`[CHURN PREVENTER] Failed for ${doc.email}:`, err);
      }
    }

    if (sent > 0) {
      await supabase.from('audit_logs').insert({
        category: 'AUTOMATION',
        event: `Churn Preventer: ${sent} retention emails sent`,
        user_name: 'System',
        target: 'at_risk_doctors',
        status: 'Success',
        severity: 'Medium',
        metadata: { sent },
      });
    }

    return NextResponse.json({ success: true, message: `Churn Preventer: ${sent} retention emails sent`, sent });
  } catch (err: any) {
    console.error('[CHURN PREVENTER ERROR]', err);
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
