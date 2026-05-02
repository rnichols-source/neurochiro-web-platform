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
 * WEEKLY DIGEST — Runs every Monday at 8 AM EST
 * Sends every doctor a personalized email with their weekly stats.
 * Free doctors get a teaser + upgrade prompt.
 * Paid doctors get the full breakdown.
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

    // Get all doctors with accounts
    const { data: doctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, slug, membership_tier, profile_views, city, state')
      .not('user_id', 'is', null);

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({ success: true, message: 'No doctors to send to', count: 0 });
    }

    // Get emails from profiles
    const userIds = doctors.map(d => d.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    const emailMap = new Map((profiles || []).map(p => [p.id, { email: p.email, name: p.full_name }]));

    let sent = 0;
    const CHUNK_SIZE = 50;

    for (let i = 0; i < doctors.length; i += CHUNK_SIZE) {
      const chunk = doctors.slice(i, i + CHUNK_SIZE);
      const emails = chunk
        .map(doc => {
          const profile = emailMap.get(doc.user_id);
          if (!profile?.email) return null;

          const isPaid = doc.membership_tier && !['starter', 'free'].includes(doc.membership_tier);
          const views = doc.profile_views || 0;
          const name = doc.first_name || profile.name?.split(' ')[0] || 'Doctor';
          const profileUrl = doc.slug ? `https://neurochiro.co/directory/${doc.slug}` : 'https://neurochiro.co';

          const body = isPaid
            ? `<p>Hi Dr. ${name},</p>
               <p>Here's your NeuroChiro weekly snapshot:</p>
               <div style="background: #F5F3EF; border-radius: 16px; padding: 24px; margin: 20px 0;">
                 <p style="font-size: 36px; font-weight: 900; color: #1E2D3B; margin: 0;">${views}</p>
                 <p style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">Total Profile Views</p>
               </div>
               <p>Patients in ${doc.city || 'your area'}${doc.state ? `, ${doc.state}` : ''} are finding you through the directory. Keep your profile updated to maximize visibility.</p>
               <p style="margin-top: 20px;"><a href="${profileUrl}" style="color: #D66829; font-weight: bold;">View your profile →</a></p>`
            : `<p>Hi Dr. ${name},</p>
               <p>Your NeuroChiro profile is live and patients are finding you.</p>
               <div style="background: #F5F3EF; border-radius: 16px; padding: 24px; margin: 20px 0;">
                 <p style="font-size: 36px; font-weight: 900; color: #1E2D3B; margin: 0;">${views}</p>
                 <p style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">Total Profile Views</p>
               </div>
               <p>Patients in ${doc.city || 'your area'} are searching for nervous system chiropractors. Upgrade to see who's viewing your profile, respond to patient messages, and unlock your full analytics dashboard.</p>
               <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/billing" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px; text-transform: uppercase; letter-spacing: 2px;">Upgrade Now</a></p>`;

          return {
            from: 'NeuroChiro <support@neurochirodirectory.com>',
            to: profile.email,
            subject: `Your NeuroChiro Weekly Report — ${views} profile views`,
            html: wrapEmail(body),
          };
        })
        .filter(Boolean) as any[];

      if (emails.length > 0) {
        await resend.batch.send(emails);
        sent += emails.length;
      }
    }

    if (sent > 0) {
      await supabase.from('audit_logs').insert({
        category: 'AUTOMATION',
        event: `Weekly Digest: ${sent} emails sent`,
        user_name: 'System',
        target: 'all_doctors',
        status: 'Success',
        severity: 'Low',
        metadata: { sent, totalDoctors: doctors.length },
      });
    }

    return NextResponse.json({ success: true, message: `Weekly digest sent to ${sent} doctors`, count: sent });
  } catch (err: any) {
    console.error('[WEEKLY DIGEST ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

