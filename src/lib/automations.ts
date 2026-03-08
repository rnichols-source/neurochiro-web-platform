import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize the Resend SDK
export const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

/**
 * DYNAMIC TWILIO LOADER
 * This prevents the 'twilio' library (which requires Node.js 'fs', 'net', 'tls')
 * from being bundled for the client side during Next.js compilation.
 */
const getTwilioClient = async () => {
  if (typeof window !== 'undefined') return null; // Never run on client
  
  const TWILIO_SID = process.env.TWILIO_ACCOUNT_SID;
  const TWILIO_AUTH = process.env.TWILIO_AUTH_TOKEN;
  
  if (!TWILIO_SID || !TWILIO_AUTH) return null;
  
  try {
    const twilio = (await import('twilio')).default;
    return twilio(TWILIO_SID, TWILIO_AUTH);
  } catch (err) {
    console.error("Failed to load Twilio:", err);
    return null;
  }
};

const TWILIO_FROM = process.env.TWILIO_PHONE;

// Admin client for backend operations
const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) return null;
  return createClient(url, key);
};

/**
 * PREMIUM BRANDED EMAIL WRAPPER
 */
const sendPremiumEmail = async (options: { to: string, subject: string, title: string, body: string, ctaText?: string, ctaUrl?: string }) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap" rel="stylesheet">
      <style>
        body { font-family: 'Lato', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #FCF9F5; }
        .wrapper { max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border-radius: 40px; overflow: hidden; margin-top: 40px; margin-bottom: 40px; box-shadow: 0 20px 50px rgba(11, 17, 24, 0.1); border: 1px solid #E5E7EB; }
        .header { background-color: #FFFFFF; padding: 40px; text-align: center; border-bottom: 1px solid #F3F4F6; }
        .content { padding: 60px 50px; color: #0B1118; }
        .btn { display: inline-block; background-color: #D66829; color: #FFFFFF !important; padding: 22px 45px; text-decoration: none; border-radius: 20px; font-weight: 900; font-size: 16px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(214, 104, 41, 0.3); }
        h1 { font-weight: 900; color: #0B1118; font-size: 32px; line-height: 1.2; margin-bottom: 25px; }
        p { font-size: 18px; line-height: 1.7; color: #4B5563; }
        .footer { text-align: center; padding: 40px; font-size: 12px; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="https://neurochiro.co/logo.png" alt="NeuroChiro" width="120" style="display: block; margin: 0 auto;">
        </div>
        <div class="content">
          <div style="text-transform: uppercase; color: #D66829; font-weight: 900; letter-spacing: 3px; font-size: 12px; margin-bottom: 15px;">${options.title}</div>
          ${options.body}
          ${options.ctaText && options.ctaUrl ? `
            <div style="text-align: center; margin-top: 50px;">
              <a href="${options.ctaUrl}" class="btn">${options.ctaText}</a>
            </div>
          ` : ''}
        </div>
        <div class="footer">
          &copy; 2026 NeuroChiro Network. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return resend.emails.send({
    from: 'NeuroChiro <team@neurochiro.co>',
    to: [options.to],
    subject: options.subject,
    html: html,
  });
};

/**
 * ROBUST QUEUING WRAPPER
 */
const enqueue = async (eventType: string, payload: Record<string, unknown>) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.log(`[AUTOMATION QUEUE MOCK] ${eventType}`, payload);
      return;
    }

    const { data, error } = await supabaseAdmin
      .from('automation_queue')
      .insert({
        event_type: eventType,
        payload: payload,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    executeAutomation(data.id, eventType, payload);
  } catch (err) {
    console.error("Failed to enqueue automation:", err);
  }
};

/**
 * SMS SENDER (TWILIO)
 */
const sendSMS = async (phone: string, message: string) => {
  const client = await getTwilioClient();
  if (!client || !TWILIO_FROM) {
    console.log(`[SMS MOCK] To ${phone}: ${message}`);
    return;
  }
  try {
    await client.messages.create({ body: message, from: TWILIO_FROM, to: phone });
    console.log(`[SMS SENT] To ${phone}`);
  } catch (err) {
    console.error("[SMS FAILED]", err);
  }
};

const executeAutomation = async (queueId: string, eventType: string, payload: Record<string, any>) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let prefs = null;
    if (supabaseAdmin && payload.userId) {
      const { data } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', payload.userId)
        .single();
      prefs = data;
    }

    const emailEnabled = prefs?.email_enabled ?? true;
    const smsEnabled = prefs?.sms_enabled ?? false;

    switch (eventType) {
      case 'welcome_email':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Welcome to NeuroChiro! 🧠',
            title: 'Account Activated',
            body: `<h1>Hello ${payload.name},</h1><p>Your journey into nervous-system-first chiropractic starts here. Explore the global directory and connect with elite practitioners today.</p>`,
            ctaText: 'Enter Dashboard',
            ctaUrl: 'https://neurochiro.co/login'
          });
        }
        if (smsEnabled && payload.phone) {
          await sendSMS(payload.phone, `Welcome to NeuroChiro, ${payload.name}! Your account is active. Log in at neurochiro.co/login`);
        }
        break;

      case 'membership_upgrade':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: `Welcome to ${payload.tierName}! 🎉`,
            title: 'Tier Upgraded',
            body: `<p>Your membership has been successfully upgraded to <strong>${payload.tierName}</strong>. You now have full access to premium clinical tools.</p>`,
            ctaText: 'Access Pro Tools',
            ctaUrl: 'https://neurochiro.co/doctor/dashboard'
          });
        }
        break;

      case 'referral_received':
        if (prefs?.referral_alerts ?? true) {
          if (emailEnabled && payload.doctorEmail) {
            await sendPremiumEmail({
              to: payload.doctorEmail,
              subject: 'New Patient Referral 📍',
              title: 'New Lead Detected',
              body: `<p>You received a new patient referral: <strong>${payload.patientName}</strong> from Dr. ${payload.referrerName}. Check your dashboard for details.</p>`,
              ctaText: 'View Referral',
              ctaUrl: 'https://neurochiro.co/doctor/messages'
            });
          }
          if (smsEnabled && payload.phone) {
            await sendSMS(payload.phone, `NeuroChiro: You have a new patient referral from Dr. ${payload.referrerName}.`);
          }
        }
        break;

      case 'event_registration':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: `Registration Confirmed: ${payload.eventName}`,
            title: 'Event Confirmed',
            body: `<p>You are confirmed for <strong>${payload.eventName}</strong>.</p><p>Check your dashboard for full event details and access links.</p>`,
            ctaText: 'View My Events',
            ctaUrl: 'https://neurochiro.co/dashboard'
          });
        }
        break;

      case 'job_application':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Application Submitted Successfully',
            title: 'Talent Marketplace',
            body: `<p>Your application for <strong>${payload.jobTitle}</strong> has been successfully submitted. The clinic will review your profile and reach out directly.</p>`,
            ctaText: 'Explore More Jobs',
            ctaUrl: 'https://neurochiro.co/marketplace'
          });
        }
        break;
        
      case 'admin_notification':
        if (process.env.NODE_ENV !== 'development') {
          await resend.emails.send({
            from: 'NeuroChiro System <alerts@neurochiro.com>',
            to: 'admin@neurochiro.com',
            subject: `[ADMIN] ${payload.subject}`,
            html: payload.html
          });
        } else {
          console.log(`[ADMIN MOCK] ${payload.subject}`, payload.html);
        }
        break;
    }

    if (supabaseAdmin) {
      await supabaseAdmin
        .from('automation_queue')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', queueId);
    }

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    const supabaseAdmin = getSupabaseAdmin();
    if (supabaseAdmin) {
      await supabaseAdmin
        .from('automation_queue')
        .update({ status: 'failed', last_error: errorMsg, updated_at: new Date().toISOString() })
        .eq('id', queueId);
    }
  }
};

export const Automations = {
  onSignup: async (userId: string, email: string, name: string, phone?: string) => {
    await enqueue('welcome_email', { userId, email, name, phone });
  },
  onMembershipUpgrade: async (userId: string, email: string, tierName: string) => {
    await enqueue('membership_upgrade', { userId, email, tierName });
  },
  onReferralSent: async (referrerId: string, referrerName: string, doctorId: string, doctorEmail: string, phone: string, patientName: string) => {
    await enqueue('referral_received', { userId: doctorId, doctorEmail, phone, patientName, referrerName });
  },
  onJobPosted: async (clinicName: string) => {
    await enqueue('admin_notification', { subject: 'New Job Posted', html: `<p>A new job was posted by: <strong>${clinicName}</strong>.</p>`});
  },
  onBroadcastDispatched: async (adminId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Broadcast Dispatched', html: `<p>Admin <strong>${adminId}</strong> dispatched a new broadcast: ${data.title}.</p>`});
  },
  onBroadcastScheduled: async (adminId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Broadcast Scheduled', html: `<p>Admin <strong>${adminId}</strong> scheduled a new broadcast: ${data.title}.</p>`});
  },
  onProfileUpdate: async (userId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Profile Updated', html: `<p>User <strong>${userId}</strong> updated their profile: ${JSON.stringify(data)}.</p>`});
  },
  onSeminarRegistration: async (userId: string, email: string, phone: string, seminarName: string) => {
    await enqueue('event_registration', { userId, email, phone, eventName: seminarName });
  },
  onJobApplication: async (applicantId: string, email: string, jobId: string, jobTitle: string) => { 
    await enqueue('job_application', { userId: applicantId, email, jobId, jobTitle });
  },
  onVendorSignup: async (vendorName: string) => {
    await enqueue('admin_notification', { subject: 'New Vendor Application', html: `<p>New vendor applied: <strong>${vendorName}</strong>.</p>`});
  },
  onMastermindApplication: async (applicantName: string) => {
    await enqueue('admin_notification', { subject: 'New Mastermind Application', html: `<p>New application received from: <strong>${applicantName}</strong>.</p>`});
  },
  onModerationAction: async (adminId: string, action: string, type: string, target: string) => {
    await enqueue('admin_notification', { subject: 'Moderation Action', html: `<p>Admin <strong>${adminId}</strong> performed <strong>${action}</strong> on <strong>${type}</strong>: ${target}.</p>`});
  },
  onSettingsToggle: async (adminId: string, setting: string, value: boolean) => {
    await enqueue('admin_notification', { subject: 'Settings Toggle', html: `<p>Admin <strong>${adminId}</strong> toggled <strong>${setting}</strong> to <strong>${value}</strong>.</p>`});
  },
  onSeminarHosted: async (userId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'New Seminar Hosted', html: `<p>User <strong>${userId}</strong> hosted a new seminar: ${JSON.stringify(data)}.</p>`});
  },
  onCampaignCreated: async (userId: string, campaignName: string) => {
    await enqueue('admin_notification', { subject: 'New Campaign Created', html: `<p>User <strong>${userId}</strong> created a new campaign: <strong>${campaignName}</strong>.</p>`});
  }
};
