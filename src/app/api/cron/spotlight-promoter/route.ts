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
 * SPOTLIGHT PROMOTER — Runs every Thursday at 10 AM EST
 * Checks for new Spotlight episodes published in the last 7 days.
 * Sends a "New Episode" email to all doctors and students.
 * Each episode is only promoted once.
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

    // Import spotlight data
    const { spotlightEpisodes } = await import('@/app/(public)/spotlight/spotlight-data');

    // Find episodes published in the last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newEpisodes = spotlightEpisodes.filter(ep =>
      new Date(ep.publishedAt) >= sevenDaysAgo
    );

    if (newEpisodes.length === 0) {
      return NextResponse.json({ success: true, message: 'No new episodes to promote', sent: 0 });
    }

    // Check which episodes were already promoted
    const { data: promoted } = await supabase
      .from('automation_queue')
      .select('payload')
      .eq('event_type', 'spotlight_promotion');

    const promotedIds = new Set((promoted || []).map((p: any) => p.payload?.episodeId));
    const toPromote = newEpisodes.filter(ep => !promotedIds.has(ep.id));

    if (toPromote.length === 0) {
      return NextResponse.json({ success: true, message: 'Episodes already promoted', sent: 0 });
    }

    const episode = toPromote[0]; // Promote one at a time

    // Get all doctors and students
    const { data: recipients } = await supabase
      .from('profiles')
      .select('email, full_name, role')
      .in('role', ['doctor', 'student']);

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ success: true, message: 'No recipients', sent: 0 });
    }

    const CHUNK_SIZE = 100;
    let sent = 0;

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      const emails = chunk.map((r: any) => ({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: r.email,
        subject: `New Spotlight: ${episode.doctorName} — ${episode.clinicName}`,
        html: wrapEmail(`
          <p style="font-size: 11px; color: #D66829; font-weight: 900; letter-spacing: 3px; text-transform: uppercase;">New Episode</p>
          <h2 style="font-size: 24px; color: #1E2D3B; margin: 8px 0 16px;">The NeuroChiro Spotlight — ${episode.doctorName}</h2>
          <p style="color: #4B5563;">${episode.clinicName} &middot; ${episode.city}, ${episode.state}</p>
          <p style="margin: 16px 0; font-style: italic; color: #4B5563;">"${episode.quote}"</p>
          <p>${episode.description.substring(0, 200)}...</p>
          <p style="margin-top: 20px;"><a href="https://neurochiro.co/spotlight" style="display: inline-block; background: #D66829; color: white; padding: 16px 32px; border-radius: 12px; font-weight: 900; text-decoration: none; font-size: 15px;">Watch Now</a></p>
        `),
      }));

      try {
        await resend.batch.send(emails);
        sent += emails.length;
      } catch (err) {
        console.error('[SPOTLIGHT PROMOTER] Batch failed:', err);
      }
    }

    // Log the promotion
    await supabase.from('automation_queue').insert({
      event_type: 'spotlight_promotion',
      payload: { episodeId: episode.id, doctorName: episode.doctorName, recipients: sent },
      status: 'completed',
    });

    await supabase.from('audit_logs').insert({
      category: 'AUTOMATION',
      event: `Spotlight Promoter: EP ${episode.episodeNumber} — ${episode.doctorName} sent to ${sent} members`,
      user_name: 'System',
      target: 'all_members',
      status: 'Success',
      severity: 'Low',
      metadata: { episodeId: episode.id, sent },
    });

    return NextResponse.json({ success: true, message: `Promoted EP ${episode.episodeNumber} to ${sent} members`, sent });
  } catch (err: any) {
    console.error('[SPOTLIGHT PROMOTER ERROR]', err);
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
