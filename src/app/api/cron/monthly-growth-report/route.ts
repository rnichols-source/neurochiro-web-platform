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
 * MONTHLY PRACTICE GROWTH REPORT
 * Runs on the 1st of every month at 8 AM EST.
 * Sends every Pro doctor a personalized report showing their profile performance.
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

    // Get all Pro doctors with accounts (not hidden)
    const { data: doctors } = await supabase
      .from('doctors')
      .select('id, user_id, first_name, last_name, slug, clinic_name, city, state, profile_views, membership_tier, verification_status')
      .not('user_id', 'is', null)
      .eq('membership_tier', 'pro')
      .neq('verification_status', 'hidden');

    if (!doctors || doctors.length === 0) {
      return NextResponse.json({ success: true, message: 'No Pro doctors to report to', sent: 0 });
    }

    // Get emails from profiles
    const userIds = doctors.map(d => d.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const emailMap = new Map((profiles || []).map(p => [p.id, p.email]));

    // Get analytics events for this month (phone taps, website clicks, booking clicks)
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString();
    const monthName = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const { data: events } = await supabase
      .from('analytics_events')
      .select('doctor_id, event_type')
      .gte('created_at', monthStart)
      .lte('created_at', monthEnd);

    // Build per-doctor event counts
    const eventCounts = new Map<string, { phone: number; website: number; booking: number; contact: number }>();
    for (const ev of (events || [])) {
      if (!ev.doctor_id) continue;
      if (!eventCounts.has(ev.doctor_id)) eventCounts.set(ev.doctor_id, { phone: 0, website: 0, booking: 0, contact: 0 });
      const counts = eventCounts.get(ev.doctor_id)!;
      if (ev.event_type === 'phone_tap') counts.phone++;
      else if (ev.event_type === 'website_click') counts.website++;
      else if (ev.event_type === 'booking_click') counts.booking++;
      else if (ev.event_type === 'contact_click') counts.contact++;
    }

    // Calculate city rankings
    const cityMap = new Map<string, any[]>();
    for (const doc of doctors) {
      const key = `${doc.city}-${doc.state}`.toLowerCase();
      if (!cityMap.has(key)) cityMap.set(key, []);
      cityMap.get(key)!.push(doc);
    }

    // Platform-wide stats
    const totalDoctors = doctors.length;
    const totalViews = doctors.reduce((sum, d) => sum + (d.profile_views || 0), 0);

    let sent = 0;

    for (const doc of doctors) {
      const email = emailMap.get(doc.user_id);
      if (!email) continue;

      const rawName = doc.first_name || 'Doctor';
      const name = rawName.replace(/^Dr\.?$/i, '') || 'Doctor';
      const views = doc.profile_views || 0;
      const actions = eventCounts.get(doc.id) || { phone: 0, website: 0, booking: 0, contact: 0 };
      const totalActions = actions.phone + actions.website + actions.booking + actions.contact;

      // City ranking
      const cityKey = `${doc.city}-${doc.state}`.toLowerCase();
      const cityDocs = cityMap.get(cityKey) || [];
      const cityRank = cityDocs.sort((a, b) => (b.profile_views || 0) - (a.profile_views || 0)).findIndex(d => d.user_id === doc.user_id) + 1;
      const cityTotal = cityDocs.length;

      const profileUrl = doc.slug ? `https://neurochiro.co/directory/${doc.slug}` : 'https://neurochiro.co/doctor/dashboard';

      const body = `
        <p>Hi Dr. ${name},</p>
        <p>Here's your <strong>Practice Growth Report</strong> for ${monthName}.</p>

        <!-- Stats Grid -->
        <div style="display: flex; gap: 12px; margin: 24px 0;">
          <div style="flex: 1; background: #F5F3EF; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: 900; color: #1E2D3B; line-height: 1;">${views}</div>
            <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;">Profile Views</div>
          </div>
          <div style="flex: 1; background: #F5F3EF; border-radius: 12px; padding: 20px; text-align: center;">
            <div style="font-size: 32px; font-weight: 900; color: #D66829; line-height: 1;">${totalActions}</div>
            <div style="font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 2px; margin-top: 6px;">Patient Actions</div>
          </div>
        </div>

        <!-- Action Breakdown -->
        ${totalActions > 0 ? `
        <div style="background: #F5F3EF; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
          <div style="font-size: 10px; font-weight: 700; color: #D66829; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 10px;">Action Breakdown</div>
          ${actions.phone > 0 ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #4B5563;"><span>Phone taps</span><strong style="color: #1E2D3B;">${actions.phone}</strong></div>` : ''}
          ${actions.website > 0 ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #4B5563;"><span>Website clicks</span><strong style="color: #1E2D3B;">${actions.website}</strong></div>` : ''}
          ${actions.booking > 0 ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #4B5563;"><span>Booking clicks</span><strong style="color: #1E2D3B;">${actions.booking}</strong></div>` : ''}
          ${actions.contact > 0 ? `<div style="display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; color: #4B5563;"><span>Contact clicks</span><strong style="color: #1E2D3B;">${actions.contact}</strong></div>` : ''}
        </div>
        ` : ''}

        <!-- City Ranking -->
        ${doc.city && cityTotal > 1 ? `
        <p style="font-size: 14px; color: #4B5563;">
          You're ranked <strong style="color: #1E2D3B;">#${cityRank} of ${cityTotal}</strong> doctors in ${doc.city}, ${doc.state} by profile views.
          ${cityRank === 1 ? "🏆 You are the top-viewed doctor in your city!" : cityRank <= 3 ? "You are in the top 3. Keep it up." : "Tip: Complete your profile and add a booking link to climb higher."}
        </p>
        ` : ''}

        <!-- Platform Stats -->
        <div style="background: #1E2D3B; border-radius: 12px; padding: 20px; margin: 20px 0; color: white;">
          <div style="font-size: 10px; font-weight: 700; color: #D66829; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 8px;">NeuroChiro Network</div>
          <div style="display: flex; justify-content: space-between; font-size: 14px;">
            <span style="color: rgba(255,255,255,0.6);">Total doctors</span>
            <strong>${totalDoctors}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 14px; margin-top: 4px;">
            <span style="color: rgba(255,255,255,0.6);">Total patient searches</span>
            <strong>${totalViews.toLocaleString()}</strong>
          </div>
        </div>

        <!-- Tips -->
        <div style="background: #FFF7ED; border-left: 4px solid #D66829; border-radius: 0 12px 12px 0; padding: 16px; margin: 20px 0;">
          <div style="font-size: 10px; font-weight: 700; color: #D66829; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">Growth Tip</div>
          <p style="font-size: 13px; color: #92400E; margin: 0; line-height: 1.6;">
            ${!doc.slug ? 'Complete your profile to start showing up in patient searches.' :
              totalActions === 0 ? 'Add a booking link to your profile. Profiles with booking links get 2x more patient engagement.' :
              actions.phone === 0 ? 'Make sure your phone number is visible on your profile. Patients prefer to call.' :
              'Share your NeuroChiro profile on social media. Doctors who share their profile get 3x more views.'}
          </p>
        </div>

        <!-- Spotlight CTA -->
        <p style="font-size: 14px; color: #4B5563;">
          Want to boost your visibility? <strong style="color: #1E2D3B;">Book a NeuroChiro Spotlight interview.</strong>
          We'll feature you to our 185K Instagram followers and promote your profile across all channels.
        </p>
        <p style="margin-top: 16px;">
          <a href="https://calendly.com/drray-neurochirodirectory/neurochiro-spotlight-interview" style="display: inline-block; background: #D66829; color: white; padding: 14px 28px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 14px;">Book Your Spotlight Interview</a>
        </p>

        <p style="margin-top: 24px; font-size: 13px; color: #9CA3AF;">
          <a href="${profileUrl}" style="color: #D66829;">View your profile →</a>
        </p>
        <p style="margin-top: 20px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>
      `;

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: email,
          subject: `Your Practice Growth Report — ${monthName}`,
          html: wrapEmail(body),
        });
        sent++;
      } catch (err) {
        console.error(`[GROWTH REPORT] Failed for ${email}:`, err);
      }
    }

    if (sent > 0) {
      await supabase.from('automation_queue').insert({
        event_type: 'monthly_growth_report',
        payload: { sent, month: monthName },
        status: 'completed',
      });
    }

    return NextResponse.json({ success: true, message: `Monthly Growth Report: ${sent} emails sent`, sent });
  } catch (err: any) {
    console.error('[GROWTH REPORT ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
