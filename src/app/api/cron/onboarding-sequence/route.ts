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
 * ONBOARDING SEQUENCE — Runs every day at 10 AM EST
 * Sends timed emails to new members based on when they signed up.
 * Day 0: Welcome (handled by signup automation)
 * Day 3: "Your profile is live"
 * Day 7: "You got X views this week"
 * Day 14: "Doctors in your city are getting messages"
 * Day 30: "Your first month on NeuroChiro"
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

    // Get all profiles created in the last 35 days
    const thirtyFiveDaysAgo = new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .in('role', ['doctor', 'student'])
      .gte('created_at', thirtyFiveDaysAgo);

    if (!recentProfiles || recentProfiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No new members in onboarding window', sent: 0 });
    }

    // Check which onboarding emails have already been sent
    const { data: sentEmails } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'onboarding_email')
      .gte('created_at', thirtyFiveDaysAgo);

    const sentKeys = new Set(
      (sentEmails || []).map((e: any) => `${e.payload?.userId}-${e.payload?.day}`)
    );

    let sent = 0;

    for (const profile of recentProfiles) {
      const daysSinceSignup = Math.floor((now.getTime() - new Date(profile.created_at).getTime()) / (1000 * 60 * 60 * 24));
      const name = profile.full_name?.split(' ')[0] || (profile.role === 'doctor' ? 'Doctor' : 'Student');
      const isDoctor = profile.role === 'doctor';

      // Determine which email to send based on days since signup
      let day: number | null = null;
      let subject = '';
      let body = '';

      if (daysSinceSignup === 3) {
        day = 3;
        subject = isDoctor
          ? `Your NeuroChiro profile is live, Dr. ${name}`
          : `Welcome to the network, ${name}`;
        body = isDoctor
          ? `<p>Hi Dr. ${name},</p>
             <p>Your profile is live in the NeuroChiro directory. Patients searching for a nervous system chiropractor in your area can now find you.</p>
             <p>Quick tip: <strong>profiles with a photo and bio get 3x more clicks.</strong> If you haven't added yours yet, it takes about 2 minutes.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/profile" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Complete Your Profile</a></p>`
          : `<p>Hi ${name},</p>
             <p>You're now part of the NeuroChiro student network. Here's what you can do right now:</p>
             <ul style="color: #4B5563;">
               <li><strong>Browse the job board</strong> — see what positions are available</li>
               <li><strong>Start the Academy</strong> — modules your school doesn't teach</li>
               <li><strong>Find seminars</strong> — upcoming events from top docs</li>
             </ul>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/student/dashboard" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Go to Dashboard</a></p>`;
      } else if (daysSinceSignup === 7) {
        day = 7;
        // Get their profile views if doctor
        let views = 0;
        if (isDoctor) {
          const { data: doc } = await supabase
            .from('doctors')
            .select('profile_views')
            .eq('user_id', profile.id)
            .single();
          views = doc?.profile_views || 0;
        }
        subject = isDoctor
          ? `Your first week on NeuroChiro — ${views} views`
          : `Your first week on NeuroChiro`;
        body = isDoctor
          ? `<p>Hi Dr. ${name},</p>
             <p>You've been on NeuroChiro for a week. Here's what happened:</p>
             <div style="background: #F5F3EF; border-radius: 16px; padding: 24px; margin: 20px 0; text-align: center;">
               <p style="font-size: 36px; font-weight: 900; color: #1E2D3B; margin: 0;">${views}</p>
               <p style="font-size: 12px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin: 4px 0 0 0;">Profile Views</p>
             </div>
             <p>Patients are finding you. Upgrade to Growth to unlock messaging, analytics, and the verified badge — so patients can contact you directly.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/billing" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">See Upgrade Options</a></p>`
          : `<p>Hi ${name},</p>
             <p>You've been on NeuroChiro for a week! Have you checked out the job board yet? New positions are posted regularly from clinics looking for students like you.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/student/jobs" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Browse Jobs</a></p>`;
      } else if (daysSinceSignup === 14) {
        day = 14;
        subject = isDoctor
          ? `Patients are trying to reach you, Dr. ${name}`
          : `Unlock your full career toolkit`;
        body = isDoctor
          ? `<p>Hi Dr. ${name},</p>
             <p>Doctors in your area are receiving patient messages through NeuroChiro. With the Growth plan, patients can message you directly from your profile.</p>
             <p>You also unlock your full analytics dashboard so you can see exactly who's finding you and how.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/billing" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Upgrade to Growth — $69/mo</a></p>`
          : `<p>Hi ${name},</p>
             <p>Ready to take your career prep to the next level? Student Pro unlocks Interview Prep, the Contract Lab, Financial Planner, and Techniques Library.</p>
             <p>These are the tools that help you land your first job and negotiate your first contract with confidence.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/student/billing" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Upgrade to Student Pro — $29/mo</a></p>`;
      } else if (daysSinceSignup === 30) {
        day = 30;
        subject = `Your first month on NeuroChiro`;
        body = isDoctor
          ? `<p>Hi Dr. ${name},</p>
             <p>You've been on NeuroChiro for a month. Thank you for being part of the network.</p>
             <p>The directory grows every week — more doctors means more patients using the platform, which means more visibility for you.</p>
             <p>If you haven't already, now is a great time to complete your profile and consider upgrading to unlock the full suite of practice tools.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/doctor/dashboard" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Go to Dashboard</a></p>`
          : `<p>Hi ${name},</p>
             <p>One month in! You're building your career on NeuroChiro. Keep browsing jobs, connecting with docs, and exploring the academy.</p>
             <p>The students who get ahead are the ones who start early. You're already ahead of most of your classmates just by being here.</p>
             <p style="margin-top: 20px;"><a href="https://neurochiro.co/student/dashboard" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none;">Go to Dashboard</a></p>`;
      }

      if (day === null) continue;

      // Check if already sent
      const key = `${profile.id}-${day}`;
      if (sentKeys.has(key)) continue;

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: profile.email,
          subject,
          html: wrapEmail(body),
        });

        await supabase.from('automation_queue').insert({
          event_type: 'onboarding_email',
          payload: { userId: profile.id, day, email: profile.email, role: profile.role },
          status: 'completed',
        });

        sent++;
      } catch (err) {
        console.error(`[ONBOARDING] Failed for ${profile.email} day ${day}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Onboarding sequence: ${sent} emails sent`,
      sent,
    });
  } catch (err: any) {
    console.error('[ONBOARDING SEQUENCE ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

