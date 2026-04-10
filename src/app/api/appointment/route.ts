import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
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
      .select('first_name, last_name, email, clinic_name, user_id')
      .eq('id', doctorId)
      .single();

    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Save to leads
    await supabase.from('leads').insert({
      email: patientEmail,
      first_name: patientName,
      source: 'appointment_request',
      role: 'patient',
      doctor_id: doctorId,
      metadata: {
        phone: patientPhone || null,
        preferred_date: preferredDate || null,
        message: message || null,
        timestamp: new Date().toISOString(),
      },
    });

    // Send notification to doctor dashboard
    if (doctor.user_id) {
      await supabase.from('notifications').insert({
        user_id: doctor.user_id,
        title: 'New Appointment Request',
        body: `${patientName} wants to book an appointment. Email: ${patientEmail}${patientPhone ? `, Phone: ${patientPhone}` : ''}${message ? `. "${message}"` : ''}`,
        type: 'appointment',
        priority: 'important',
        link: null,
      });
    }

    // Send email to doctor
    if (doctor.email) {
      await resend.emails.send({
        from: 'NeuroChiro <support@neurochirodirectory.com>',
        to: [doctor.email],
        subject: `New Appointment Request from ${patientName}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
            <div style="text-align: center; margin-bottom: 32px;">
              <h1 style="font-size: 24px; font-weight: 800; color: #1E2D3B; margin: 0;">NEURO<span style="color: #D66829;">CHIRO</span></h1>
            </div>
            <h2 style="font-size: 20px; font-weight: 700; color: #1E2D3B; margin-bottom: 16px;">
              New Appointment Request
            </h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
              A patient found you on NeuroChiro and wants to book an appointment.
            </p>
            <div style="background: #f5f3ef; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 120px;">Name</td>
                  <td style="padding: 8px 0; color: #1E2D3B; font-size: 15px; font-weight: 600;">${patientName}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Email</td>
                  <td style="padding: 8px 0; color: #1E2D3B; font-size: 15px;"><a href="mailto:${patientEmail}" style="color: #D66829; font-weight: 600;">${patientEmail}</a></td>
                </tr>
                ${patientPhone ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Phone</td>
                  <td style="padding: 8px 0; color: #1E2D3B; font-size: 15px;"><a href="tel:${patientPhone}" style="color: #D66829; font-weight: 600;">${patientPhone}</a></td>
                </tr>
                ` : ''}
                ${preferredDate ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Preferred Date</td>
                  <td style="padding: 8px 0; color: #1E2D3B; font-size: 15px; font-weight: 600;">${preferredDate}</td>
                </tr>
                ` : ''}
                ${message ? `
                <tr>
                  <td style="padding: 8px 0; color: #999; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Message</td>
                  <td style="padding: 8px 0; color: #1E2D3B; font-size: 15px;">${message}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            <p style="color: #555; font-size: 14px; line-height: 1.6;">
              Please reach out to this patient within 1-2 business days. They found you through the NeuroChiro directory.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 32px; border-top: 1px solid #eee; padding-top: 16px;">
              This email was sent because you have a profile on <a href="https://neurochiro.co" style="color: #D66829;">neurochiro.co</a>
            </p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[APPOINTMENT_API] Error:', err);
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 });
  }
}
