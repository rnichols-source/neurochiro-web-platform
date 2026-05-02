import { wrapEmail } from '@/lib/email-template';
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
 * PROFILE NUDGER — Runs every day at 9 AM EST
 * Finds doctors with incomplete profiles and sends ONE nudge per missing item.
 * Tracks nudges so it doesn't spam — only sends each nudge type once.
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

    // Get all verified doctors with accounts
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, photo_url, bio, specialties, slug, city')
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

    // Check existing nudges to avoid spamming
    const { data: existingNudges } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'profile_nudge')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const recentNudgeKeys = new Set(
      (existingNudges || []).map((n: any) => `${n.payload?.userId}-${n.payload?.nudgeType}`)
    );

    let sent = 0;

    for (const doc of doctors) {
      const profile = emailMap.get(doc.user_id);
      if (!profile?.email) continue;

      const name = doc.first_name || profile.name?.split(' ')[0] || 'Doctor';
      const profileUrl = doc.slug ? `https://neurochiro.co/directory/${doc.slug}` : 'https://neurochiro.co/doctor/profile';

      // Determine what's missing
      let nudgeType: string | null = null;
      let subject = '';
      let body = '';

      if (!doc.photo_url) {
        nudgeType = 'missing_photo';
        subject = 'Add your photo — profiles with photos get 3x more clicks';
        body = `<p>Hi Dr. ${name},</p>
          <p>Your NeuroChiro profile is live, but it's missing a photo.</p>
          <p>Profiles with photos get <strong>3x more patient clicks</strong> than those without. It takes 30 seconds to upload one.</p>
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/profile" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px;">Add Your Photo</a></p>`;
      } else if (!doc.bio || doc.bio.length < 20) {
        nudgeType = 'missing_bio';
        subject = 'Your profile needs a bio — patients want to know your story';
        body = `<p>Hi Dr. ${name},</p>
          <p>Your NeuroChiro profile has a great photo, but patients want to know more about you. A bio helps them decide if you're the right fit.</p>
          <p>Don't know what to write? Use our <strong>AI Bio Generator</strong> — it writes a professional bio for you in seconds.</p>
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/profile" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px;">Write Your Bio</a></p>`;
      } else if (!doc.specialties || doc.specialties.length === 0) {
        nudgeType = 'missing_specialties';
        subject = 'Add your specialties so the right patients find you';
        body = `<p>Hi Dr. ${name},</p>
          <p>Your NeuroChiro profile looks great! One more thing — adding your specialties helps patients searching for specific care find you faster.</p>
          <p>Just list 2-3 things you focus on: Pediatrics, Prenatal, Sports, Neurological, etc.</p>
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/profile" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px;">Add Specialties</a></p>`;
      }

      if (!nudgeType) continue; // Profile is complete

      // Check if we already sent this nudge recently
      const nudgeKey = `${doc.user_id}-${nudgeType}`;
      if (recentNudgeKeys.has(nudgeKey)) continue;

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: profile.email,
          subject,
          html: wrapEmail(body),
        });

        // Log the nudge so we don't repeat it
        await supabase.from('automation_queue').insert({
          event_type: 'profile_nudge',
          payload: { userId: doc.user_id, nudgeType, email: profile.email },
          status: 'completed',
        });

        sent++;
      } catch (err) {
        console.error(`[PROFILE NUDGER] Failed for ${profile.email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Profile nudger: ${sent} nudges sent`,
      sent,
    });
  } catch (err: any) {
    console.error('[PROFILE NUDGER ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

