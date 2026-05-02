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
 * FOLLOW-UP BOT — Runs every morning at 7 AM EST
 * Checks outreach prospects that need follow-ups.
 * Auto-sends follow-up emails for those with email addresses.
 * Auto-archives after 3 follow-ups with no response.
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
    const now = new Date().toISOString();

    // Get prospects with follow-ups due
    const { data: prospects } = await supabase
      .from('outreach_prospects')
      .select('*')
      .in('status', ['contacted', 'followed_up'])
      .lte('follow_up_at', now)
      .order('follow_up_at', { ascending: true });

    if (!prospects || prospects.length === 0) {
      return NextResponse.json({ success: true, message: 'No follow-ups due', sent: 0, archived: 0 });
    }

    let sent = 0;
    let archived = 0;

    for (const prospect of prospects) {
      const followUpCount = (prospect.follow_up_count || 1) + 1;

      // After 3 follow-ups, auto-archive
      if (followUpCount > 3) {
        await supabase
          .from('outreach_prospects')
          .update({
            status: 'not_interested',
            follow_up_at: null,
            notes: (prospect.notes || '') + '\n[Auto-archived after 3 follow-ups with no response]',
            updated_at: now,
          })
          .eq('id', prospect.id);
        archived++;
        continue;
      }

      // If they have an email, send auto follow-up
      if (prospect.email) {
        const name = prospect.name?.split(' ')[0] || 'Doctor';
        const profileLink = prospect.notes?.match(/neurochiro\.co\/directory\/[\w-]+/)?.[0] || 'neurochiro.co';

        const subject = followUpCount === 2
          ? `Quick follow-up — your NeuroChiro profile`
          : `Last note from me`;

        const body = followUpCount === 2
          ? `<p>Hi ${name},</p>
             <p>Just wanted to make sure my last message didn't get buried. I created a profile for your practice on NeuroChiro and it's live here:</p>
             <p><a href="https://${profileLink}" style="color: #D66829; font-weight: bold;">${profileLink}</a></p>
             <p>Patients in ${prospect.city || 'your area'} can already find you through the directory. If you'd like to add your photo and bio to make it yours, it takes about 2 minutes.</p>
             <p>No pressure at all — just didn't want you to miss it.</p>
             <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>`
          : `<p>Hi ${name},</p>
             <p>I know you're busy running your practice, so I'll keep this short. Your profile on NeuroChiro is still live:</p>
             <p><a href="https://${profileLink}" style="color: #D66829; font-weight: bold;">${profileLink}</a></p>
             <p>It's there whenever you're ready to claim it. If the timing isn't right, no worries at all. Wishing you and your practice the best.</p>
             <p style="margin-top: 30px;"><strong>Dr. Raymond Nichols</strong><br>Founder, NeuroChiro</p>`;

        try {
          await resend.emails.send({
            from: 'NeuroChiro <support@neurochirodirectory.com>',
            to: prospect.email,
            subject,
            html: wrapEmail(body),
          });
          sent++;
        } catch (err) {
          console.error(`[FOLLOW-UP BOT] Failed to send to ${prospect.email}:`, err);
        }
      }

      // Update the prospect
      const nextFollowUp = new Date();
      nextFollowUp.setDate(nextFollowUp.getDate() + 5);

      await supabase
        .from('outreach_prospects')
        .update({
          status: 'followed_up',
          follow_up_count: followUpCount,
          follow_up_at: followUpCount >= 3 ? null : nextFollowUp.toISOString(),
          script_used: `auto_follow_up_${followUpCount}`,
          updated_at: now,
        })
        .eq('id', prospect.id);
    }

    // Log the results
    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Follow-Up Bot: ${sent} emails sent, ${archived} archived`,
      user_name: 'System',
      target: 'outreach_prospects',
      status: 'Success',
      severity: 'Low',
      metadata: { sent, archived, total: prospects.length },
    });

    return NextResponse.json({
      success: true,
      message: `Follow-up bot: ${sent} emails sent, ${archived} archived`,
      sent,
      archived,
    });
  } catch (err: any) {
    console.error('[FOLLOW-UP BOT ERROR]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function wrapEmail(body: string) {
  return `<!DOCTYPE html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
    <style>body{font-family:'Lato',Helvetica,Arial,sans-serif;margin:0;padding:0;background:#FCF9F5;}
    .wrapper{max-width:600px;margin:40px auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.08);border:1px solid #E5E7EB;}
    .content{padding:40px;color:#1E2D3B;font-size:16px;line-height:1.7;}
    .footer{text-align:center;padding:30px;font-size:11px;color:#9CA3AF;letter-spacing:1px;text-transform:uppercase;font-weight:700;}</style>
    </head><body><div class="wrapper">
    <div class="content">${body}</div>
    <div class="footer">&copy; 2026 NeuroChiro Network</div>
    </div></body></html>`;
}
