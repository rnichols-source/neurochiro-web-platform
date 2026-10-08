import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { rateLimit, getIP } from '@/lib/rate-limit';

const limiter = rateLimit('patient-request', { maxRequests: 3, windowMs: 60_000 });

export async function POST(req: NextRequest) {
  try {
    const ip = getIP(req);
    const { allowed } = limiter.check(ip);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

    const { doctorId, patientEmail, patientName, _hp } = await req.json();

    // Honeypot — silent reject
    if (_hp) {
      return NextResponse.json({ success: true });
    }

    if (!doctorId || !patientEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Block obvious spam email patterns
    const emailLower = patientEmail.toLowerCase();
    const domain = emailLower.split('@')[1] || '';
    const blockedDomains = ['mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com', 'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'yopmail.com', 'trashmail.com'];
    if (blockedDomains.includes(domain)) {
      return NextResponse.json({ success: true }); // Silent reject
    }
    // Reject emails with suspicious patterns (random chars with dots/numbers)
    const localPart = emailLower.split('@')[0] || '';
    if (/^[a-z]\.[a-z]{2}\.[a-z]\.[a-z]{2}\.[a-z]{2}\.\d/.test(localPart) || /^[a-z]{1,2}\.\d{1,3}$/.test(localPart.split('.').slice(-1)[0] || '')) {
      return NextResponse.json({ success: true }); // Silent reject
    }

    const supabase = createAdminClient();

    // Get doctor info for notification
    const { data: doctor } = await supabase
      .from('doctors')
      .select('id, first_name, last_name, user_id, slug, city, state')
      .eq('id', doctorId)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Insert patient request
    const { error: prError } = await (supabase as any).from('patient_requests').insert({
      doctor_id: doctorId,
      patient_email: patientEmail,
      patient_name: patientName || null,
      patient_city: null,
      source: 'profile_nudge',
    });

    if (prError) {
      console.error('[PATIENT_REQUEST] Insert failed:', prError);
    }

    // Send notification to doctor (if they have a user account)
    if (doctor.user_id) {
      const { sendNotification } = await import('@/lib/notifications');
      await sendNotification({
        userId: doctor.user_id,
        title: 'A patient is trying to reach you!',
        body: `Someone${patientName ? ` (${patientName})` : ''} wants your contact info. Upgrade to Pro to connect.`,
        type: 'system',
        priority: 'important',
        link: '/doctor/billing',
      });
    }

    // Send email to doctor if we have their email
    if (doctor.user_id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name')
        .eq('id', doctor.user_id)
        .single();

      if (profile?.email) {
        try {
          const { Resend } = await import('resend');
          const resend = new Resend(process.env.RESEND_API_KEY);
          const location = [doctor.city, doctor.state].filter(Boolean).join(', ');
          await resend.emails.send({
            from: 'NeuroChiro <support@neurochirodirectory.com>',
            to: [profile.email],
            subject: `A patient ${patientName ? `(${patientName}) ` : ''}just tried to reach you on NeuroChiro`,
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#1a2744;padding:28px;text-align:center;">
                  <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
                  <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Missed Patient Connection</p>
                </div>
                <div style="padding:28px;background:white;">
                  <p style="font-size:15px;color:#1a2744;">Dr. ${doctor.first_name || profile.full_name || 'Doctor'},</p>
                  <p style="color:#666;line-height:1.6;">A patient just searched for a nervous system chiropractor${location ? ` in <strong>${location}</strong>` : ''}, found your profile, and tried to contact you.</p>
                  ${patientName ? `<div style="background:#f8f9fa;border-left:4px solid #e97325;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="margin:0;font-weight:bold;color:#1a2744;">Patient: ${patientName}</p>
                    <p style="margin:4px 0 0;color:#666;font-size:14px;">Email: ${patientEmail}</p>
                  </div>` : `<div style="background:#f8f9fa;border-left:4px solid #e97325;border-radius:8px;padding:16px;margin:20px 0;">
                    <p style="margin:0;color:#666;">A patient left their email but your contact info isn't visible yet.</p>
                  </div>`}
                  <p style="color:#666;line-height:1.6;">They couldn't see your phone number or website because your profile isn't on the Pro plan yet. Upgrade now and this patient — and every future patient — can reach you directly.</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="https://neurochiro.co/doctor/billing" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Upgrade to Pro — $99/mo</a>
                  </div>
                  <p style="color:#999;font-size:13px;text-align:center;">One new patient pays for a full year of NeuroChiro.</p>
                </div>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error('[PATIENT_REQUEST] Email failed:', emailErr);
        }
      }
    }

    // Discord notification — doctor info only, no patient data
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
      fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 **PATIENT INQUIRY**\n\nA patient wants to reach **${name}** in ${doctor.city || 'their area'}.`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATIENT_REQUEST] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
