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

// Campaign dates
const CAMPAIGN_START = new Date('2026-07-02T00:00:00Z');
const DEADLINE = new Date('2026-08-01T00:00:00Z');
const BILLING_LINK = 'https://neurochiro.co/doctor/billing';

/**
 * FREE-TO-PAID CONVERSION CAMPAIGN
 * Runs daily. Checks campaign phase and sends appropriate email.
 *
 * Day 0 (July 2): Email 1 — The Announcement
 * Day 10 (July 12): Email 2 — The Value Nudge
 * Day 25 (July 27): Email 3 — Final Notice
 * Day 30 (August 1): Auto-hide all remaining free profiles
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
    const daysSinceCampaignStart = Math.floor((now.getTime() - CAMPAIGN_START.getTime()) / (1000 * 60 * 60 * 24));

    // Get all free doctors with accounts (not already hidden)
    const { data: freeDoctors } = await supabase
      .from('doctors')
      .select('user_id, first_name, last_name, clinic_name, profile_views, verification_status')
      .eq('membership_tier', 'free')
      .not('user_id', 'is', null)
      .neq('verification_status', 'hidden');

    if (!freeDoctors || freeDoctors.length === 0) {
      return NextResponse.json({ success: true, message: 'No free doctors to process', sent: 0 });
    }

    // Get emails from profiles
    const userIds = freeDoctors.map(d => d.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const emailMap = new Map((profiles || []).map(p => [p.id, p.email]));

    // Check which emails have already been sent
    const { data: sentEmails } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'free_to_paid_campaign');

    const sentKeys = new Set(
      (sentEmails || []).map((e: any) => `${e.payload?.userId}-${e.payload?.phase}`)
    );

    let sent = 0;
    let hidden = 0;

    // PHASE: DAY 30+ — Auto-hide remaining free profiles
    if (now >= DEADLINE) {
      for (const doc of freeDoctors) {
        await supabase
          .from('doctors')
          .update({ verification_status: 'hidden' })
          .eq('user_id', doc.user_id);
        hidden++;
      }

      if (hidden > 0) {
        await supabase.from('automation_queue').insert({
          event_type: 'free_to_paid_campaign',
          payload: { phase: 'auto_hide', count: hidden, date: now.toISOString() },
          status: 'completed',
        });
      }

      return NextResponse.json({ success: true, message: `Auto-hid ${hidden} free profiles (deadline reached)`, hidden });
    }

    // Determine which email phase we're in
    let phase: string | null = null;
    let subject = '';
    let buildBody: ((doc: any, views: number) => string) | null = null;

    if (daysSinceCampaignStart >= 25 && daysSinceCampaignStart < 30) {
      phase = 'email_3_final';
      subject = '5 days left. Your profile will be removed.';
      buildBody = (doc, views) => `
        <p>Dr. ${doc.first_name},</p>
        <p>Final heads up. On August 1, your NeuroChiro profile will be <strong>removed from the directory entirely.</strong></p>
        <p><strong>What that means:</strong></p>
        <ul>
          <li>Your listing will no longer appear in search results</li>
          <li>Patients will not be able to find you on NeuroChiro</li>
          <li>Your profile page will no longer be accessible</li>
          <li>You will not be featured in any promotions, Spotlights, or city pages</li>
        </ul>
        <p><strong>What you keep if you activate Pro ($49/mo):</strong></p>
        <ul>
          <li>Full profile live in the directory</li>
          <li>Patients can find you, call you, book with you, message you</li>
          <li>Full analytics dashboard</li>
          <li>Spotlight eligibility (185K followers)</li>
          <li>Locked at $49/mo forever (price goes to $79 at 200 doctors)</li>
        </ul>
        <p>This is the last email I'll send about this. The link below takes 60 seconds:</p>
        <p style="margin-top: 20px;"><a href="${BILLING_LINK}" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">Activate Pro — $49/mo</a></p>
        <p style="margin-top: 16px; font-size: 13px; color: #9CA3AF;">If you have questions, reply to this email. I read every one.</p>
        <p style="margin-top: 20px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
      `;
    } else if (daysSinceCampaignStart >= 10 && daysSinceCampaignStart < 25) {
      phase = 'email_2_value';
      buildBody = (doc, views) => {
        subject = `${views} patients found your profile`;
        return `
          <p>Hey Dr. ${doc.first_name},</p>
          <p>Quick update on your NeuroChiro profile.</p>
          <p>Since you joined, <strong>${views} patients have viewed your listing.</strong> But right now, they can't reach you easily because your profile doesn't have full Pro features (messaging, phone display, booking link).</p>
          <p><strong>Here's what Pro doctors get that you're missing:</strong></p>
          <ul>
            <li>Your phone number and booking link visible to every patient who finds you</li>
            <li>Patient messaging (they can contact you directly from your profile)</li>
            <li>Analytics showing exactly who's viewing your profile and how they found you</li>
            <li>Spotlight interview eligibility (promoted to 185K followers)</li>
            <li>Priority placement in search results</li>
            <li>Weekly Practice Growth Report</li>
          </ul>
          <p>One new patient from the directory pays for an entire year of Pro. The average new patient is worth $2,000-5,000. Pro is $49/mo.</p>
          <p style="margin-top: 20px;"><a href="${BILLING_LINK}" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">Activate Before August 1</a></p>
          <p style="margin-top: 12px; font-size: 13px; color: #9CA3AF;">After August 1, your profile will be completely removed from the directory. Patients will no longer be able to find you on NeuroChiro.</p>
          <p style="margin-top: 20px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
        `;
      };
    } else if (daysSinceCampaignStart >= 0 && daysSinceCampaignStart < 10) {
      phase = 'email_1_announce';
      subject = 'Your NeuroChiro profile is changing';
      buildBody = (doc, views) => `
        <p>Hey Dr. ${doc.first_name},</p>
        <p>I'm writing you personally because NeuroChiro is evolving, and I want you to be part of it.</p>
        <p>Over the next 90 days, we're investing heavily in driving real patient traffic to every doctor on the platform:</p>
        <ul>
          <li>SEO city landing pages (so patients Googling "nervous system chiropractor near me" find YOU)</li>
          <li>Weekly doctor features to our 185K Instagram followers</li>
          <li>Spotlight interview series on YouTube</li>
          <li>Google Ads in top cities</li>
          <li>Monthly Practice Growth Reports with your analytics</li>
        </ul>
        <p>Every Pro member gets rotated through these promotions. Your profile has <strong>${views} views</strong> so far, and we're about to multiply that.</p>
        <p><strong>Here's what's changing:</strong> starting August 1, 2026, all directory profiles will require a Pro membership ($49/mo). Profiles without Pro will be <strong>completely removed from the directory.</strong> Patients will not be able to find you, see your listing, or contact you.</p>
        <p>As an early member, you can lock in <strong>$49/mo forever.</strong> This price goes to $79/mo when we hit 200 doctors. We're at 117 right now.</p>
        <p style="margin-top: 20px;"><a href="${BILLING_LINK}" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">Activate Pro — $49/mo</a></p>
        <p style="margin-top: 12px; font-size: 13px; color: #9CA3AF;">You have 30 days.</p>
        <p style="margin-top: 20px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
      `;
    }

    if (!phase || !buildBody) {
      return NextResponse.json({ success: true, message: 'No campaign phase active today', sent: 0 });
    }

    // Send emails
    for (const doc of freeDoctors) {
      const email = emailMap.get(doc.user_id);
      if (!email) continue;

      const key = `${doc.user_id}-${phase}`;
      if (sentKeys.has(key)) continue;

      const views = doc.profile_views || 0;
      const rawName = doc.first_name || 'Doctor';
      const name = rawName.replace(/^Dr\.?$/i, '') || 'Doctor';

      // For email 2, subject includes view count
      let emailSubject = subject;
      if (phase === 'email_2_value') {
        emailSubject = `${views} patients found your profile`;
      }

      try {
        const body = buildBody({ ...doc, first_name: name }, views);
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: email,
          subject: emailSubject,
          html: wrapEmail(body),
        });

        await supabase.from('automation_queue').insert({
          event_type: 'free_to_paid_campaign',
          payload: { userId: doc.user_id, phase, email, name },
          status: 'completed',
        });

        sent++;
        console.log(`[FREE-TO-PAID] Sent ${phase} to Dr. ${name} (${email})`);
      } catch (err) {
        console.error(`[FREE-TO-PAID] Failed for ${email}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Free-to-paid campaign: phase=${phase}, sent=${sent}, daysSinceCampaignStart=${daysSinceCampaignStart}`,
      sent,
      phase,
    });
  } catch (err: any) {
    console.error('[FREE-TO-PAID ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
