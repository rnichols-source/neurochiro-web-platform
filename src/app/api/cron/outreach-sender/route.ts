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
 * OUTREACH SENDER — Runs daily at 8 AM EST
 * Auto pre-builds profiles and sends initial emails for up to 10
 * new prospects per day that have a website (to find email) but
 * haven't been contacted yet.
 *
 * This is the "set it and forget it" outreach agent.
 * Pairs with Follow-Up Bot for the complete sequence.
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

    // Get new prospects with websites (so we can find emails)
    const { data: prospects } = await supabase
      .from('outreach_prospects')
      .select('*')
      .eq('status', 'new')
      .not('website', 'is', null)
      .order('created_at', { ascending: true })
      .limit(DAILY_LIMIT);

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ success: true, message: 'No new prospects with websites', sent: 0, built: 0 });
    }

    let built = 0;
    let emailsSent = 0;
    let skipped = 0;

    for (const p of prospects as any[]) {
      // Step 1: Find email from website
      let email = p.email;
      if (!email && p.website) {
        email = await findEmailFromWebsite(p.website);
        if (email) {
          await supabase.from('outreach_prospects').update({ email, updated_at: new Date().toISOString() }).eq('id', p.id);
        }
      }

      if (!email) {
        skipped++;
        continue; // Can't send without email — skip this one
      }

      // Step 2: Pre-build profile
      const fullName = (p.name || '').replace(/^Dr\.?\s*/i, '').trim();
      const nameParts = fullName.split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const baseSlug = `${firstName}-${lastName}-${(p.city || '').replace(/\s+/g, '-')}`
        .toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
      const slug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;

      // Check if already exists
      const { data: existing } = await supabase
        .from('doctors')
        .select('id, slug')
        .ilike('first_name', firstName)
        .ilike('last_name', lastName || '%')
        .ilike('city', p.city || '%')
        .limit(1);

      let profileUrl: string;

      if (existing && existing.length > 0) {
        profileUrl = `https://neurochiro.co/directory/${(existing as any[])[0].slug}`;
      } else {
        const { error: insertError } = await supabase.from('doctors').insert({
          first_name: firstName,
          last_name: lastName,
          slug,
          clinic_name: p.clinic_name || `${firstName} ${lastName} Chiropractic`,
          city: p.city || '',
          state: p.state || '',
          country: 'United States',
          address: '',
          latitude: 0,
          longitude: 0,
          bio: '',
          specialties: [],
          verification_status: 'verified',
          membership_tier: 'starter',
          region_code: 'US',
          is_founding_member: false,
          phone: p.phone || null,
          email: email,
          website_url: p.website || null,
          instagram_url: p.instagram_handle ? `https://instagram.com/${p.instagram_handle.replace('@', '')}` : null,
        });

        if (insertError) {
          console.error(`[OUTREACH SENDER] Failed to create profile for ${p.name}:`, insertError);
          skipped++;
          continue;
        }

        profileUrl = `https://neurochiro.co/directory/${slug}`;
        built++;
      }

      // Step 3: Send outreach email
      const clinicName = p.clinic_name || `${firstName} ${lastName} Chiropractic`;
      try {
        await resend.emails.send({
          from: 'NeuroChiro <support@neurochirodirectory.com>',
          to: email,
          subject: 'Your NeuroChiro profile is live',
          html: wrapEmail(`
            <p>Hi ${firstName || 'Doctor'},</p>
            <p>My name is Dr. Raymond Nichols, and I'm the founder of NeuroChiro — the global directory built specifically for nervous system chiropractors.</p>
            <p>I created a profile for ${clinicName} on our platform, and it's already live:</p>
            <p style="margin: 20px 0;"><a href="${profileUrl}" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">View Your Profile</a></p>
            <p>Patients in ${p.city || 'your area'} are actively using NeuroChiro to find chiropractors like you. Claim your profile, add your photo and bio, and you're set. Takes about 2 minutes. No cost.</p>
            <p>Let me know if you have any questions.</p>
            <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro<br>neurochiro.co</p>
          `),
        });
        emailsSent++;
      } catch (err) {
        console.error(`[OUTREACH SENDER] Email failed for ${email}:`, err);
      }

      // Step 4: Update prospect status
      const followUp = new Date();
      followUp.setDate(followUp.getDate() + 5);
      await supabase.from('outreach_prospects').update({
        status: 'contacted',
        contacted_at: new Date().toISOString(),
        follow_up_at: followUp.toISOString(),
        follow_up_count: 1,
        script_used: 'auto_outreach_sender',
        notes: `Pre-built profile: ${profileUrl} | Auto-email sent by Outreach Sender`,
        updated_at: new Date().toISOString(),
      }).eq('id', p.id);
    }

    // Audit log
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Outreach Sender: ${built} profiles built, ${emailsSent} emails sent, ${skipped} skipped`,
      user_name: 'System',
      target: 'outreach_prospects',
      status: 'Success',
      severity: 'Medium',
      metadata: { built, emailsSent, skipped },
    });

    return NextResponse.json({ success: true, message: `Outreach Sender: ${built} built, ${emailsSent} sent, ${skipped} skipped`, built, sent: emailsSent, skipped });
  } catch (err: any) {
    console.error('[OUTREACH SENDER ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function findEmailFromWebsite(websiteUrl: string): Promise<string | null> {
  let url = websiteUrl.trim();
  if (!url.startsWith('http')) url = `https://${url}`;

  for (const page of [url, `${url}/contact`, `${url}/contact-us`, `${url}/about`]) {
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
      if (valid.length > 0) return valid.find(e => /^(info|contact|office|hello|admin|support|dr|doc)/i.test(e)) || valid[0];
    } catch { continue; }
  }
  return null;
}

