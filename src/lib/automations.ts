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

export const executeAutomation = async (queueId: string, eventType: string, payload: Record<string, any>) => {
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
      case 'geocode_profile':
        if (supabaseAdmin && payload.userId && payload.city) {
          try {
            // Very basic mock for actual geocoding API (e.g., Mapbox/Google)
            // In a real app you'd do: fetch(`https://api.mapbox.com/geocoding/v5/mapbox.places/${payload.city}.json?access_token=${...}`)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(payload.city)}`);
            const data = await response.json();
            
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              
              await supabaseAdmin.from('doctors').update({
                location_lat: lat,
                location_lng: lng
              }).eq('id', payload.userId);
            }
          } catch (e) {
            console.error("Geocoding failed for:", payload.city, e);
          }
        }
        break;

      case 'welcome_email':
        if (emailEnabled && payload.email) {
          let subject = 'Welcome to NeuroChiro! 🧠';
          let title = 'Account Activated';
          let body = `<h1>Hello ${payload.name || payload.full_name || 'there'},</h1><p>Your journey into nervous-system-first chiropractic starts here. Explore the global directory and connect with elite practitioners today.</p>`;
          let ctaText = 'Enter Dashboard';
          let ctaUrl = 'https://neurochiro.co/login';

          if (payload.role === 'doctor') {
            subject = 'Welcome to the NeuroChiro Network 🌍';
            title = 'Doctor Account Created';
            body = `<h1>Welcome Dr. ${payload.name || payload.full_name || ''},</h1><p>Your directory profile has been created. To start receiving referrals and join the global map, complete your clinic profile and select a membership tier.</p>`;
            ctaText = 'Setup My Profile';
            ctaUrl = 'https://neurochiro.co/doctor/settings';
          } else if (payload.role === 'student') {
            subject = 'Welcome to NeuroChiro Student Network 🎓';
            title = 'Student Account Created';
            body = `<h1>Welcome ${payload.name || payload.full_name || ''},</h1><p>You are now part of the global talent pool. Top clinics are looking for nervous-system focused associates. Complete your resume and explore the job board.</p>`;
            ctaText = 'Explore Job Board';
            ctaUrl = 'https://neurochiro.co/student/jobs';
          } else if (payload.role === 'vendor') {
            subject = 'Welcome to NeuroChiro Marketplace 🏢';
            title = 'Vendor Account Created';
            body = `<h1>Welcome ${payload.name || payload.full_name || ''},</h1><p>Set up your vendor profile to start offering products and services to thousands of specialized chiropractors.</p>`;
            ctaText = 'Vendor Dashboard';
            ctaUrl = 'https://neurochiro.co/vendor/dashboard';
          } else {
            // Patient / Public
            subject = 'Your Journey to Health Starts Here 🌱';
            title = 'Patient Account Activated';
            body = `<h1>Welcome ${payload.name || payload.full_name || ''},</h1>
                    <p>Understanding your nervous system is the first step to true healing. We've curated educational resources to help you understand chiropractic care.</p>
                    <p>Use our directory to find a verified practitioner near you.</p>`;
            ctaText = 'Find a Doctor';
            ctaUrl = 'https://neurochiro.co/directory';
          }

          await sendPremiumEmail({ to: payload.email, subject, title, body, ctaText, ctaUrl });
        }
        if (smsEnabled && payload.phone) {
          await sendSMS(payload.phone, `Welcome to NeuroChiro! Your account is active. Log in at neurochiro.co/login`);
        }
        break;

      case 'mass_email_broadcast':
        if (payload.isTest) {
          // Send only to the test email
          if (payload.testEmail) {
            await sendPremiumEmail({
              to: payload.testEmail,
              subject: `[TEST] ${payload.subject}`,
              title: payload.title,
              body: payload.body,
              ctaText: payload.ctaText,
              ctaUrl: payload.ctaUrl
            });
          }
        } else if (supabaseAdmin) {
          // Fetch target audience
          let query = supabaseAdmin.from('profiles').select('email, role, subscription_tier');
          
          if (payload.audience !== 'all') {
            if (payload.audience === 'paid_doctors') {
              query = query.eq('role', 'doctor').in('subscription_tier', ['pro', 'elite']);
            } else {
              query = query.eq('role', payload.audience);
            }
          }
          
          const { data: users } = await query;
          
          if (users && users.length > 0) {
            // For production, consider bulk sending via Resend API
            for (const u of users) {
              if (u.email) {
                // To avoid rate limits in this loop, a real system would chunk or enqueue individual emails.
                // We'll send them here for now, assuming small initial batches.
                await sendPremiumEmail({
                  to: u.email,
                  subject: payload.subject,
                  title: payload.title,
                  body: payload.body,
                  ctaText: payload.ctaText,
                  ctaUrl: payload.ctaUrl
                });
              }
            }
          }
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
        
      case 'payment_success':
        if (supabaseAdmin && payload.stripeData) {
          const session = payload.stripeData;
          const customerId = session.customer;
          const userId = session.client_reference_id;
          
          if (userId) {
            await supabaseAdmin.from('profiles').update({
              stripe_customer_id: customerId,
              subscription_status: 'active'
            }).eq('id', userId);
            
            const { data: profile } = await supabaseAdmin.from('profiles').select('role, full_name, email').eq('id', userId).single();
            if (profile?.role === 'doctor') {
               await supabaseAdmin.from('doctors').update({ is_verified: true }).eq('id', userId);
               
               if (emailEnabled && profile.email) {
                  await sendPremiumEmail({
                    to: profile.email,
                    subject: 'Your Directory Listing is Live! 🌍',
                    title: 'Directory Activated',
                    body: `<p>Congratulations Dr. ${profile.full_name || 'Doctor'}, your profile is now live on the global NeuroChiro map. You can now start receiving patient referrals.</p>`,
                    ctaText: 'View Dashboard',
                    ctaUrl: 'https://neurochiro.co/doctor/dashboard'
                  });
               }
            }
          }
        }
        break;

      case 'payment_failed':
        if (supabaseAdmin && payload.stripeData) {
          const customerId = payload.stripeData.customer;
          if (customerId) {
            const { data: profile } = await supabaseAdmin.from('profiles').select('id, email, full_name').eq('stripe_customer_id', customerId).single();
            if (profile) {
              await supabaseAdmin.from('profiles').update({ subscription_status: 'past_due' }).eq('id', profile.id);
              if (emailEnabled && profile.email) {
                await sendPremiumEmail({
                  to: profile.email,
                  subject: 'Action Required: Payment Failed',
                  title: 'Payment Issue',
                  body: `<p>Hi ${profile.full_name || 'Member'}, your recent payment attempt failed. Please update your billing information to maintain access to your tier benefits.</p>`,
                  ctaText: 'Update Billing',
                  ctaUrl: 'https://neurochiro.co/doctor/settings'
                });
              }
            }
          }
        }
        break;

      case 'subscription_canceled':
        if (supabaseAdmin && payload.stripeData) {
          const customerId = payload.stripeData.customer;
          if (customerId) {
            const { data: profile } = await supabaseAdmin.from('profiles').select('id, role').eq('stripe_customer_id', customerId).single();
            if (profile) {
              await supabaseAdmin.from('profiles').update({ subscription_status: 'canceled' }).eq('id', profile.id);
              // Hide from directory
              if (profile.role === 'doctor') {
                await supabaseAdmin.from('doctors').update({ is_verified: false }).eq('id', profile.id);
              }
            }
          }
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
  },
  onPaymentSuccess: async (data: any) => {
    await enqueue('payment_success', { stripeData: data });
  },
  onPaymentFailed: async (data: any) => {
    await enqueue('payment_failed', { stripeData: data });
  },
  onSubscriptionCanceled: async (data: any) => {
    await enqueue('subscription_canceled', { stripeData: data });
  }
};
