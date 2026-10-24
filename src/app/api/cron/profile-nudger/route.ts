import { wrapEmail } from '@/lib/email-template';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { getNudgeTarget } from '@/lib/profile-completeness';

export const maxDuration = 300;

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const getResend = () => new Resend(process.env.RESEND_API_KEY || '');

/**
 * PROFILE NUDGER — Runs daily
 * Uses the SAME completeness function as the profile editor widget.
 * One source of truth: src/lib/profile-completeness.ts
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

    // Get all verified doctors with accounts — include all fields the completeness check needs
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, photo_url, bio, short_intro, specialties, slug, city, chiropractic_school, hours, first_visit_price, payment_model, phone, booking_url, google_reviews_url')
      .eq('verification_status', 'verified')
      .not('user_id', 'is', null);

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({ success: true, message: 'No doctors to check', count: 0 });
    }

    // Get emails
    const userIds = doctors.map(d => d.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const emailMap = new Map((profiles || []).map(p => [p.id, { email: p.email, name: p.full_name }]));

    // Check existing nudges to avoid spamming (7 day window)
    const { data: existingNudges } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'profile_nudge')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const recentNudgeKeys = new Set(
      (existingNudges || []).map((n: any) => `${n.payload?.userId}-${n.payload?.nudgeType}`)
    );

    let sent = 0;
    const wouldSend: { name: string; email: string; nudge: string }[] = [];
    const dryRun = new URL(req.url).searchParams.get('dry_run') === 'true';

    for (const doc of doctors) {
      const profile = emailMap.get(doc.user_id);
      if (!profile?.email) continue;

      // Use the shared completeness function — same as the profile editor widget
      const nudgeTarget = getNudgeTarget(doc);
      if (!nudgeTarget || !nudgeTarget.nudgeSubject) continue;

      const nudgeKey = `${doc.user_id}-${nudgeTarget.key}`;
      if (recentNudgeKeys.has(nudgeKey)) continue;

      const rawName = doc.first_name || profile.name?.split(' ')[0] || 'Doctor';
      const name = rawName.replace(/^Dr\.?$/i, '') || 'Doctor';

      wouldSend.push({ name: `Dr. ${doc.first_name} ${doc.last_name}`, email: profile.email, nudge: nudgeTarget.key });

      if (dryRun) continue;

      try {
        const body = `<p>Hi Dr. ${name},</p>
          <p>${nudgeTarget.nudgeBody}</p>
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/profile" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px;">${nudgeTarget.label === 'Profile photo' ? 'Add Your Photo' : nudgeTarget.label === 'Bio or intro' ? 'Write Your Bio' : 'Add ' + nudgeTarget.label}</a></p>`;

        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: profile.email,
          subject: nudgeTarget.nudgeSubject,
          html: wrapEmail(body),
        });

        await supabase.from('automation_queue').insert({
          event_type: 'profile_nudge',
          payload: { userId: doc.user_id, nudgeType: nudgeTarget.key, email: profile.email },
          status: 'completed',
        });

        sent++;
      } catch (err) {
        console.error(`[PROFILE NUDGER] Failed for ${profile.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: dryRun ? `Dry run: ${wouldSend.length} would receive nudges` : `Profile nudger: ${sent} nudges sent`,
      sent: dryRun ? 0 : sent,
      wouldSend,
      dryRun,
    });
  } catch (err: any) {
    console.error('[PROFILE NUDGER ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
