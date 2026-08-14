import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';

// Demo details — update these for each demo
const ZOOM_LINK = "https://zoom.us/j/PLACEHOLDER";
const DEMO_DATE = "August 28, 2026";
const DEMO_TIME = "7:00 PM EST";
const DEMO_DATETIME = new Date("2026-08-28T19:00:00-04:00");

// Reminder schedule (hours before the demo)
const REMINDERS = [
  { hoursBeforeMin: 167, hoursBeforeMax: 169, key: "1_week", subject: "One week away — Care Plan Closer Demo", body: getOneWeekEmail },
  { hoursBeforeMin: 23, hoursBeforeMax: 25, key: "1_day", subject: "Tomorrow at 7 PM — Care Plan Closer Demo", body: getOneDayEmail },
  { hoursBeforeMin: 0.9, hoursBeforeMax: 1.2, key: "1_hour", subject: "Starting in 1 hour — Care Plan Closer Demo", body: getOneHourEmail },
  { hoursBeforeMin: 0.2, hoursBeforeMax: 0.35, key: "15_min", subject: "We're about to go live 🔴", body: getFifteenMinEmail },
];

function getOneWeekEmail(name: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0F1A24;padding:32px;text-align:center;">
        <h1 style="color:white;font-size:22px;margin:0;">Care Plan Closer</h1>
        <p style="color:#D66829;font-size:14px;font-weight:bold;margin:8px 0 0;">Live Demo — ${DEMO_DATE}</p>
      </div>
      <div style="padding:32px;background:white;">
        <p style="font-size:15px;color:#1a2744;">Hey ${name},</p>
        <p style="color:#666;line-height:1.6;">Just a quick reminder. One week from today, I'm doing a live demo of the Care Plan Closer.</p>
        <p style="color:#666;line-height:1.6;">I'll build a care plan from scratch, show you how I present it during a report of findings, and share the real results from my own practice.</p>
        <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 4px;font-weight:bold;color:#1a2744;">${DEMO_DATE} at ${DEMO_TIME}</p>
          <p style="margin:0;color:#666;font-size:14px;">Zoom link will be in your next reminder email.</p>
        </div>
        <p style="color:#666;line-height:1.6;">There are only 10 beta spots available at the end. Show up live if you want first access.</p>
        <p style="color:#999;font-size:13px;margin-top:24px;">Dr. Ray</p>
      </div>
      <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">NeuroChiro — neurochiro.co</div>
    </div>`;
}

function getOneDayEmail(name: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0F1A24;padding:32px;text-align:center;">
        <h1 style="color:white;font-size:22px;margin:0;">Tomorrow Night</h1>
        <p style="color:#D66829;font-size:14px;font-weight:bold;margin:8px 0 0;">${DEMO_TIME} — Care Plan Closer Demo</p>
      </div>
      <div style="padding:32px;background:white;">
        <p style="font-size:15px;color:#1a2744;">Hey ${name},</p>
        <p style="color:#666;line-height:1.6;">Tomorrow at ${DEMO_TIME}, I'm going live. Here's your Zoom link:</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${ZOOM_LINK}" style="display:inline-block;background:#D66829;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:16px;">Join Zoom Meeting</a>
        </div>
        <p style="color:#666;line-height:1.6;">I'll show you exactly how I build and present care plans that patients say yes to. Plus, the first 10 doctors get beta access at a fraction of the full price.</p>
        <p style="color:#666;line-height:1.6;">See you tomorrow.</p>
        <p style="color:#999;font-size:13px;margin-top:24px;">Dr. Ray</p>
      </div>
      <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">NeuroChiro — neurochiro.co</div>
    </div>`;
}

function getOneHourEmail(name: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#D66829;padding:24px;text-align:center;">
        <h1 style="color:white;font-size:22px;margin:0;">Starting in 1 Hour</h1>
      </div>
      <div style="padding:32px;background:white;">
        <p style="font-size:15px;color:#1a2744;">Hey ${name},</p>
        <p style="color:#666;line-height:1.6;">The Care Plan Closer demo starts in one hour. Click below to join when it's time.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${ZOOM_LINK}" style="display:inline-block;background:#D66829;color:white;padding:16px 40px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:18px;">Join Now</a>
        </div>
        <p style="color:#999;font-size:13px;">Today at ${DEMO_TIME} on Zoom</p>
      </div>
    </div>`;
}

function getFifteenMinEmail(name: string) {
  return `
    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#D66829;padding:24px;text-align:center;">
        <h1 style="color:white;font-size:24px;margin:0;">We're About to Go Live</h1>
      </div>
      <div style="padding:32px;background:white;text-align:center;">
        <p style="font-size:16px;color:#1a2744;font-weight:bold;">The demo starts in 15 minutes.</p>
        <div style="margin:24px 0;">
          <a href="${ZOOM_LINK}" style="display:inline-block;background:#D66829;color:white;padding:18px 48px;border-radius:12px;text-decoration:none;font-weight:bold;font-size:20px;">Join Now</a>
        </div>
        <p style="color:#999;font-size:13px;">See you in there, ${name}.</p>
      </div>
    </div>`;
}

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow without auth in development
    if (process.env.NODE_ENV === 'production' && !request.url.includes('localhost')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const now = new Date();
    const hoursUntilDemo = (DEMO_DATETIME.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Find which reminder window we're in
    const activeReminder = REMINDERS.find(r => hoursUntilDemo >= r.hoursBeforeMin && hoursUntilDemo <= r.hoursBeforeMax);

    if (!activeReminder) {
      return NextResponse.json({ success: true, message: `No reminder due. ${hoursUntilDemo.toFixed(1)} hours until demo.`, sent: 0 });
    }

    const supabase = createAdminClient();

    // Get all demo registrants
    const { data: registrants } = await supabase
      .from('leads')
      .select('email, first_name, metadata')
      .eq('source', 'care_plan_closer_demo');

    if (!registrants || registrants.length === 0) {
      return NextResponse.json({ success: true, message: 'No registrants found', sent: 0 });
    }

    // Check which registrants already got this reminder
    const alreadySent = new Set<string>();
    registrants.forEach((r: any) => {
      const meta = (r.metadata || {}) as any;
      const sentReminders = meta.sent_reminders || [];
      if (sentReminders.includes(activeReminder.key)) {
        alreadySent.add(r.email);
      }
    });

    const toSend = registrants.filter((r: any) => !alreadySent.has(r.email));

    if (toSend.length === 0) {
      return NextResponse.json({ success: true, message: `${activeReminder.key} already sent to all registrants`, sent: 0 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY || '');
    let sent = 0;

    for (const registrant of toSend) {
      const name = (registrant as any).first_name || 'there';
      const email = (registrant as any).email as string;
      try {
        await resend.emails.send({
          from: 'Dr. Ray <support@neurochirodirectory.com>',
          to: [email],
          subject: activeReminder.subject,
          html: activeReminder.body(name),
        });

        // Mark this reminder as sent in metadata
        const currentMeta = ((registrant as any).metadata || {}) as any;
        const sentReminders = currentMeta.sent_reminders || [];
        await supabase
          .from('leads')
          .update({
            metadata: { ...currentMeta, sent_reminders: [...sentReminders, activeReminder.key] },
          } as any)
          .eq('email', email)
          .eq('source', 'care_plan_closer_demo');

        sent++;
      } catch (emailErr) {
        console.error(`[DEMO REMINDER] Failed to send to ${email}:`, emailErr);
      }
    }

    // Discord notification
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl && sent > 0) {
      fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📧 **DEMO REMINDER SENT** (${activeReminder.key})\n\nSent "${activeReminder.subject}" to ${sent} registrants`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, reminder: activeReminder.key, sent, total: registrants.length });
  } catch (error) {
    console.error('[DEMO REMINDERS] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
