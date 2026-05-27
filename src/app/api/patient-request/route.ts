import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  try {
    const { doctorId, patientEmail, patientName } = await req.json();

    if (!doctorId || !patientEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    await (supabase as any).from('patient_requests').insert({
      doctor_id: doctorId,
      patient_email: patientEmail,
      patient_name: patientName || null,
      patient_city: null,
      source: 'profile_nudge',
    });

    // Send notification to doctor (if they have a user account)
    if (doctor.user_id) {
      const { insertNotification } = await import('@/lib/notifications');
      await insertNotification(
        doctor.user_id,
        'A patient is trying to reach you!',
        `Someone${patientName ? ` (${patientName})` : ''} wants your contact info. Upgrade to Pro to connect.`,
        'lead',
        '/doctor/billing',
        'important'
      );
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
          await resend.emails.send({
            from: 'NeuroChiro <support@neurochirodirectory.com>',
            to: [profile.email],
            subject: 'A patient is looking for you on NeuroChiro',
            html: `
              <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                <div style="background:#1a2744;padding:28px;text-align:center;">
                  <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro</h1>
                  <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Patient Request</p>
                </div>
                <div style="padding:28px;background:white;">
                  <p style="font-size:15px;color:#1a2744;">Hey Dr. ${doctor.first_name || profile.full_name || 'Doctor'},</p>
                  <p style="color:#666;line-height:1.6;">A patient${patientName ? ` named <strong>${patientName}</strong>` : ''} found your profile on NeuroChiro and wants to connect with you.</p>
                  <p style="color:#666;line-height:1.6;">Your contact info is currently locked. Upgrade to Pro ($49/mo) to make your phone, website, and booking link visible to patients.</p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="https://neurochiro.co/doctor/billing" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">Upgrade to Pro — $49/mo</a>
                  </div>
                  <p style="color:#999;font-size:13px;">One new patient pays for a full year of NeuroChiro.</p>
                </div>
              </div>
            `,
          });
        } catch (emailErr) {
          console.error('[PATIENT_REQUEST] Email failed:', emailErr);
        }
      }
    }

    // Discord notification
    const discordUrl = process.env.DISCORD_WEBHOOK_URL;
    if (discordUrl) {
      const name = `Dr. ${doctor.first_name || ''} ${doctor.last_name || ''}`.trim();
      fetch(discordUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🔔 **PATIENT REQUEST**\n\nPatient${patientName ? ` (${patientName})` : ''} wants to reach **${name}**\nDoctor profile: https://neurochiro.co/directory/${doctor.slug}\nPatient email: ${patientEmail}`,
        }),
      }).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[PATIENT_REQUEST] Error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
