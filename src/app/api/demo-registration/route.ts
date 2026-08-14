import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';

// Placeholder — replace with actual Zoom link when created
const ZOOM_LINK = "https://zoom.us/j/PLACEHOLDER";
const DEMO_DATE = "August 28, 2026";
const DEMO_TIME = "7:00 PM EST";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, first_name, _hp } = body;

    // Honeypot
    if (_hp) return NextResponse.json({ success: true });
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 });

    const supabase = createAdminClient();

    // Save to leads table
    await supabase.from('leads').upsert({
      email,
      first_name: first_name || null,
      source: 'care_plan_closer_demo',
      role: 'doctor',
      status: 'new',
      metadata: {
        timestamp: new Date().toISOString(),
        event: 'care_plan_closer_demo',
        demo_date: DEMO_DATE,
      },
    }, { onConflict: 'email' }).then(({ error }) => {
      if (error) {
        // Fallback insert if upsert fails
        supabase.from('leads').insert({
          email,
          first_name: first_name || null,
          source: 'care_plan_closer_demo',
          role: 'doctor',
          status: 'new',
          metadata: { timestamp: new Date().toISOString(), event: 'care_plan_closer_demo' },
        });
      }
    });

    // Send confirmation email via Resend
    try {
      const resend = new Resend(process.env.RESEND_API_KEY || '');
      const name = first_name || 'there';

      await resend.emails.send({
        from: 'Dr. Ray <support@neurochirodirectory.com>',
        to: [email],
        subject: `You're registered — Care Plan Closer Demo on ${DEMO_DATE}`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#0F1A24;padding:32px;text-align:center;">
              <h1 style="color:white;font-size:24px;margin:0;">Care Plan Closer</h1>
              <p style="color:#D66829;font-size:16px;font-weight:bold;margin:8px 0 0;">Live Demo — ${DEMO_DATE}</p>
            </div>
            <div style="padding:32px;background:white;">
              <p style="font-size:16px;color:#1a2744;">Hey ${name},</p>
              <p style="color:#666;line-height:1.6;">You're registered for the Care Plan Closer live demo. Here's everything you need:</p>

              <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:24px 0;">
                <p style="margin:0 0 8px;font-weight:bold;color:#1a2744;">When:</p>
                <p style="margin:0 0 16px;color:#666;">${DEMO_DATE} at ${DEMO_TIME}</p>
                <p style="margin:0 0 8px;font-weight:bold;color:#1a2744;">Where:</p>
                <p style="margin:0;color:#666;">Zoom (link below)</p>
              </div>

              <div style="text-align:center;margin:24px 0;">
                <a href="${ZOOM_LINK}" style="display:inline-block;background:#D66829;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Join Zoom Meeting</a>
              </div>

              <h3 style="color:#1a2744;">What you'll see:</h3>
              <ul style="color:#666;line-height:2;">
                <li>A live care plan built from scratch in real time</li>
                <li>How to present it so patients say yes</li>
                <li>The exact scripts and word tracks I use</li>
                <li>Real results from my own practice</li>
                <li>An exclusive beta offer for the first 10 doctors only</li>
              </ul>

              <p style="color:#999;font-size:13px;margin-top:24px;">Save this email. I'll send a reminder the day before.</p>
            </div>
            <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999;">
              NeuroChiro — neurochiro.co
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('[DEMO] Confirmation email failed:', emailErr);
    }

    // Discord notification
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `🎯 **CARE PLAN CLOSER DEMO SIGNUP**\n\n**${first_name || 'Unknown'}** just registered\nEmail: ${email}\nDemo: ${DEMO_DATE} at ${DEMO_TIME}`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[DEMO] Registration error:', err);
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 });
  }
}
