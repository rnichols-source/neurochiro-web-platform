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
 * UPGRADE NUDGER — Runs daily at 11 AM EST
 * Monitors free doctor activity and sends targeted upgrade emails
 * based on real milestones. Each nudge type fires ONCE per doctor.
 *
 * Triggers:
 * - First profile view ever
 * - 25 total profile views
 * - 50 total profile views
 * - 100 total profile views
 * - Profile saved by a patient (if trackable)
 * - 14 days as free member
 * - 30 days as free member
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

    // Get all free-tier doctors with accounts
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, profile_views, city, state, slug, membership_tier, created_at')
      .not('user_id', 'is', null)
      .in('membership_tier', ['starter', 'free']);

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({ success: true, message: 'No free doctors to nudge', sent: 0 });
    }

    // Get emails
    const userIds = doctors.map(d => d.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .in('id', userIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Get existing nudges to avoid duplicates
    const { data: existingNudges } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'upgrade_nudge');

    const sentNudges = new Set(
      (existingNudges || []).map((n: any) => `${n.payload?.userId}-${n.payload?.trigger}`)
    );

    let sent = 0;

    for (const doc of doctors) {
      const profile = profileMap.get(doc.user_id);
      if (!profile?.email) continue;

      const name = doc.first_name || profile.full_name?.split(' ')[0] || 'Doctor';
      const views = doc.profile_views || 0;
      const daysSinceJoin = Math.floor((Date.now() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const profileUrl = doc.slug ? `https://neurochiro.co/directory/${doc.slug}` : 'https://neurochiro.co/doctor/dashboard';

      // Determine which nudge to send (only one per run, priority order)
      let trigger: string | null = null;
      let subject = '';
      let body = '';

      if (views >= 100 && !sentNudges.has(`${doc.user_id}-views_100`)) {
        trigger = 'views_100';
        subject = `100 patients found your profile, Dr. ${name}`;
        body = `<p>Your NeuroChiro profile has been viewed <strong>100 times</strong>.</p>
          <p>That's 100 patients who searched for a nervous system chiropractor and found <strong>you</strong>.</p>
          <p>Right now, they can see your listing but they can't message you or see your full analytics. Upgrade to Growth and turn those views into actual patients walking through your door.</p>`;
      } else if (views >= 50 && !sentNudges.has(`${doc.user_id}-views_50`)) {
        trigger = 'views_50';
        subject = `50 profile views — patients are finding you, Dr. ${name}`;
        body = `<p>Your profile has been viewed <strong>50 times</strong> on NeuroChiro.</p>
          <p>Patients in ${doc.city || 'your area'} are actively searching for chiropractors like you. With Growth, you can see exactly who's viewing your profile, respond to patient messages, and show up with a verified badge.</p>`;
      } else if (views >= 25 && !sentNudges.has(`${doc.user_id}-views_25`)) {
        trigger = 'views_25';
        subject = `25 people viewed your profile this month`;
        body = `<p>Your NeuroChiro listing is getting attention — <strong>25 profile views</strong> and counting.</p>
          <p>These are real patients looking for nervous system chiropractors in ${doc.city || 'your area'}. Upgrade to unlock patient messaging so they can reach you directly.</p>`;
      } else if (views >= 1 && !sentNudges.has(`${doc.user_id}-first_view`)) {
        trigger = 'first_view';
        subject = `Someone just found your profile, Dr. ${name}`;
        body = `<p>Your NeuroChiro profile got its first view!</p>
          <p>A patient in ${doc.city || 'your area'} searched for a nervous system chiropractor and found you. This is just the beginning — as the directory grows, so does your visibility.</p>
          <p>Make sure your profile is complete (photo + bio) to maximize clicks.</p>`;
      } else if (daysSinceJoin >= 30 && !sentNudges.has(`${doc.user_id}-day_30`)) {
        trigger = 'day_30';
        subject = `One month on NeuroChiro — here's what you could unlock`;
        body = `<p>You've been on NeuroChiro for 30 days, Dr. ${name}.</p>
          <p>In that time, your profile has been viewed ${views} times. Imagine what you could do with the full toolkit: patient messaging, analytics dashboard, KPI tracker, verified badge, and priority search placement.</p>
          <p>Doctors who upgrade see an average of 3x more patient engagement. Your listing is already working — give it the tools to work harder.</p>`;
      } else if (daysSinceJoin >= 14 && !sentNudges.has(`${doc.user_id}-day_14`)) {
        trigger = 'day_14';
        subject = `Two weeks in — are you getting the most out of NeuroChiro?`;
        body = `<p>Hi Dr. ${name},</p>
          <p>You've been on NeuroChiro for two weeks. Your profile is live and patients can find you.</p>
          <p>But there's more you could be doing. Growth members get patient messaging, analytics, the KPI tracker, and a verified badge that tells patients you're the real deal.</p>
          <p>Most doctors upgrade within the first month. Here's what they unlock:</p>
          <ul style="color: #4B5563;">
            <li>Direct patient messaging</li>
            <li>Full analytics dashboard</li>
            <li>Verified provider badge</li>
            <li>KPI Tracker</li>
            <li>AI Bio Generator</li>
          </ul>`;
      }

      if (!trigger) continue;

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: profile.email,
          subject,
          html: wrapEmail(`${body}
            <p style="margin-top: 24px;">
              <a href="https://neurochiro.co/doctor/billing" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">See Upgrade Options</a>
            </p>
            <p style="margin-top: 16px; font-size: 13px; color: #9CA3AF;">Your free listing stays active regardless. Upgrade whenever you're ready.</p>`),
        });

        // Log so we don't send again
        await supabase.from('automation_queue').insert({
          event_type: 'upgrade_nudge',
          payload: { userId: doc.user_id, trigger, email: profile.email, views },
          status: 'completed',
        });

        sent++;
      } catch (err) {
        console.error(`[UPGRADE NUDGER] Failed for ${profile.email}:`, err);
      }
    }

    if (sent > 0) {
      await supabase.from('audit_logs').insert({
        category: 'AUTOMATION',
        event: `Upgrade Nudger: ${sent} nudges sent`,
        user_name: 'System',
        target: 'free_doctors',
        status: 'Success',
        severity: 'Low',
        metadata: { sent },
      });
    }

    return NextResponse.json({ success: true, message: `Upgrade nudger: ${sent} nudges sent`, sent });
  } catch (err: any) {
    console.error('[UPGRADE NUDGER ERROR]', err);
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
