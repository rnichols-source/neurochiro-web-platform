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
 * SEMINAR HOST OUTREACH AGENT — Runs Tue & Thu at 11 AM EST
 * Auto-discovers emails and sends seminar marketplace pitch
 * to seminar host prospects. Processes up to 10 per run.
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
    const DAILY_LIMIT = 10;

    // Get new seminar host prospects with websites
    const { data: prospects } = await supabase
      .from('outreach_prospects')
      .select('*')
      .eq('status', 'new')
      .eq('prospect_type', 'seminar_host')
      .not('website', 'is', null)
      .order('created_at', { ascending: true })
      .limit(DAILY_LIMIT);

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ success: true, message: 'No new seminar host prospects', sent: 0 });
    }

    let emailsSent = 0;
    let skipped = 0;

    for (const p of prospects as any[]) {
      // Step 1: Find email from website if missing
      let email = p.email;
      if (!email && p.website) {
        email = await findEmailFromWebsite(p.website);
        if (email) {
          await supabase.from('outreach_prospects').update({
            email,
            updated_at: new Date().toISOString(),
          }).eq('id', p.id);
        }
      }

      if (!email) {
        skipped++;
        continue;
      }

      // Step 2: Send seminar host outreach email
      const orgName = p.clinic_name || p.name;
      const contactName = p.name || 'there';

      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: email,
          subject: `List your seminars on NeuroChiro`,
          html: wrapEmail(`
            <p>Hi ${contactName},</p>
            <p>My name is Dr. Raymond Nichols, founder of <strong>NeuroChiro</strong> — the global platform for nervous system chiropractors.</p>
            <p>I came across ${orgName} and your continuing education programs look incredible. We've built a <strong>seminar marketplace</strong> on NeuroChiro where chiropractors discover and register for events, and I think your seminars would be a perfect fit.</p>
            <p>Here's what you get:</p>
            <ul style="color: #1E2D3B; line-height: 1.8;">
              <li>Your seminars listed in our searchable directory with interactive map</li>
              <li>Exposure to our entire network of nervous system chiropractors</li>
              <li>Registration tracking and attendee management</li>
              <li>Featured placement options for maximum visibility</li>
            </ul>
            <p style="margin: 24px 0;">
              <a href="https://neurochiro.co/host-a-seminar" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">List a Seminar</a>
            </p>
            <p>Our doctors are actively looking for CE opportunities, especially in nervous system techniques and functional neurology. Your events would get great visibility with exactly the right audience.</p>
            <p>Would you be interested? I'd love to walk you through it — takes about 5 minutes to list your first event.</p>
            <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro<br>neurochiro.co</p>
          `),
        });
        emailsSent++;
      } catch (err) {
        console.error(`[SEMINAR HOST OUTREACH] Email failed for ${email}:`, err);
        skipped++;
        continue;
      }

      // Step 3: Update prospect status (critical — prevents re-emailing)
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + 5);
      const { error: updateError } = await supabase.from('outreach_prospects').update({
        status: 'contacted',
        contacted_at: new Date().toISOString(),
        follow_up_at: followUp.toISOString(),
        follow_up_count: 1,
        script_used: 'auto_seminar_host_outreach',
        notes: `Auto-email sent by Seminar Host Outreach Agent`,
        updated_at: new Date().toISOString(),
      }).eq('id', p.id);
      if (updateError) console.error(`[SEMINAR HOST OUTREACH] Status update failed for ${p.name}:`, updateError);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Seminar Host Outreach: ${emailsSent} emails sent, ${skipped} skipped`,
      user_name: 'System',
      target: 'outreach_prospects',
      status: 'Success',
      severity: 'Medium',
      metadata: { emailsSent, skipped },
    });

    return NextResponse.json({
      success: true,
      message: `Seminar Host Outreach: ${emailsSent} sent, ${skipped} skipped`,
      sent: emailsSent,
      skipped,
    });
  } catch (err: any) {
    console.error('[SEMINAR HOST OUTREACH ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function findEmailFromWebsite(websiteUrl: string): Promise<string | null> {
  let url = websiteUrl.trim();
  if (!url.startsWith('http')) url = `https://${url}`;

  for (const page of [url, `${url}/contact`, `${url}/contact-us`, `${url}/about`, `${url}/about-us`]) {
    try {
      const res = await fetch(page, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NeuroChiro/1.0)' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) continue;
      const html = await res.text();
      const emails = html.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
      const junk = ['example.com', 'sentry.io', 'wix.com', 'squarespace.com', 'wordpress.com', 'google.com', 'facebook.com', 'cloudflare', '.png', '.jpg', '.svg', '.css', '.js'];
      const valid = emails.filter(e => !junk.some(j => e.toLowerCase().includes(j)));
      if (valid.length > 0) return valid.find(e => /^(info|contact|office|hello|admin|support|register|events|ce)/i.test(e)) || valid[0];
    } catch { continue; }
  }
  return null;
}
