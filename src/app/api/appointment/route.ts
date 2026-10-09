import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';
import { rateLimit, getIP } from '@/lib/rate-limit';
import crypto from 'crypto';

const limiter = rateLimit('appointment', { maxRequests: 3, windowMs: 60_000 });

export async function POST(request: NextRequest) {
  const { allowed } = limiter.check(getIP(request));
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 });
  try {
    const body = await request.json();
    const { patientName, patientEmail, patientPhone, preferredDate, message, doctorId } = body;

    if (!patientName || !patientEmail || !doctorId) {
      return NextResponse.json({ error: 'Name, email, and doctor are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY || '');

    // Get doctor info
    const { data: doctor } = await supabase
      .from('doctors')
      .select('first_name, last_name, email, clinic_name, city, state, user_id')
      .eq('id', doctorId)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    const doctorName = `Dr. ${doctor.first_name} ${doctor.last_name}`.trim();
    const practiceName = doctor.clinic_name || doctorName;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') || 'https://neurochiro.co';
    const acknowledgeToken = crypto.randomBytes(32).toString('hex');
    const withdrawalToken = crypto.randomBytes(32).toString('hex');

    // Build note from message + preferred date
    const noteParts: string[] = [];
    if (preferredDate) noteParts.push(`Preferred date: ${preferredDate}`);
    if (message) noteParts.push(message);
    const note = noteParts.join('. ') || null;

    // Save to contact_requests (unified system)
    const { data: insertedRequest, error: insertErr } = await (supabase as any).from('contact_requests').insert({
      doctor_id: doctorId,
      name: patientName.trim(),
      phone: patientPhone?.trim() || '',
      note,
      consent_text: 'Patient submitted an appointment request form on neurochiro.co',
      consented_at: new Date().toISOString(),
      ip: getIP(request),
      status: 'new',
      withdrawal_token: withdrawalToken,
      acknowledge_token: acknowledgeToken,
      acknowledge_token_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      source: 'appointment',
    }).select('id').single();

    if (insertErr) {
      console.error('[APPOINTMENT_API] Insert error:', insertErr);
    }

    const requestId = insertedRequest?.id;

    // Send notification to doctor dashboard
    if (doctor.user_id) {
      await supabase.from('notifications').insert({
        user_id: doctor.user_id,
        title: 'New Appointment Request',
        body: `${patientName} wants to book an appointment.${patientPhone ? ` Phone: ${patientPhone}` : ''}${message ? ` "${message}"` : ''}`,
        type: 'appointment',
        priority: 'important',
        link: null,
      })
    }

    // Send email to doctor with acknowledge button
    const ackUrl = `${siteUrl}/api/contact-request/acknowledge?token=${acknowledgeToken}`;
    if (doctor.email) {
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: [doctor.email],
        subject: `Contact request from ${patientName} — wants your office to reach out`,
        html: `
          <div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1E2D3B;">
            <p><strong>${patientName}</strong> found your NeuroChiro profile and is asking your office to contact them.</p>
            <div style="background:#f5f5f5;padding:16px;border-radius:10px;margin:16px 0;">
              <p style="margin:0 0 8px;font-size:14px;"><strong>Name:</strong> ${patientName}</p>
              ${patientPhone ? `<p style="margin:0 0 8px;font-size:14px;"><strong>Phone:</strong> <a href="tel:${patientPhone}" style="color:#D66829;font-weight:700;">${patientPhone}</a></p>` : ''}
              <p style="margin:0 0 8px;font-size:14px;"><strong>Email:</strong> <a href="mailto:${patientEmail}" style="color:#D66829;font-weight:700;">${patientEmail}</a></p>
              ${note ? `<p style="margin:0;font-size:14px;"><strong>Note:</strong> ${note}</p>` : ''}
            </div>
            <p style="font-size:13px;color:#666;">This patient explicitly requested contact from ${practiceName}. Their consent is recorded.</p>
            <p style="margin:24px 0;">
              <a href="${ackUrl}" style="display:inline-block;padding:16px 32px;background:#22c55e;color:white;text-decoration:none;border-radius:10px;font-weight:700;font-size:16px;">I've contacted this patient</a>
            </p>
            <p style="font-size:12px;color:#999;">One tap lets us know you handled it. You can also acknowledge from your <a href="https://neurochiro.co/doctor/dashboard" style="color:#D66829;">dashboard</a>.</p>
          </div>
        `,
      });

      // Log step 1
      if (requestId) {
        await (supabase as any).from('contact_request_escalations').insert({
          contact_request_id: requestId, step: 1, channel: 'email',
        }).then(() => {}).catch(() => {});
      }
    }

    // Discord notification
    try {
      const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
      if (webhookUrl) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📱 **New Contact Request**\n**Patient:** ${patientName}\n**Phone:** ${patientPhone || 'not provided'}\n**Email:** ${patientEmail}\n**Doctor:** ${doctorName} (${doctor.city}, ${doctor.state})\n**Source:** appointment form${note ? `\n**Note:** ${note}` : ''}\n\n→ https://neurochiro.co/admin/contact-requests`
          }),
        }).catch(() => {});
      }
    } catch {}

    // Send confirmation email to the patient
    const withdrawUrl = `${siteUrl}/api/contact-request/withdraw?token=${withdrawalToken}`;
    await resend.emails.send({
      from: 'NeuroChiro <support@neurochirodirectory.com>',
      to: [patientEmail],
      subject: `Your contact request to ${practiceName} is confirmed`,
      html: `
        <div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;color:#1E2D3B;">
          <p>Hi ${patientName},</p>
          <p>Your request has been sent to <strong>${practiceName}</strong>. They have your contact info and will reach out to you.</p>
          <p style="font-size:13px;color:#666;">Changed your mind? <a href="${withdrawUrl}" style="color:#D66829;font-weight:700;">Withdraw this request</a>.</p>
          <p style="font-size:12px;color:#999;margin-top:24px;">This email was sent because you submitted a contact request on <a href="https://neurochiro.co" style="color:#D66829;">neurochiro.co</a>.</p>
        </div>
      `,
    }).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[APPOINTMENT_API] Error:', err);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
