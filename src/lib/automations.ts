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
    from: 'NeuroChiro <support@neurochirodirectory.com>',
    to: [options.to],
    subject: options.subject,
    html: html,
  });
};

/**
 * ROBUST QUEUING WRAPPER
 */
const enqueue = async (eventType: string, payload: Record<string, unknown>, delayMinutes: number = 0) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      console.log(`[AUTOMATION QUEUE MOCK] ${eventType}`, payload);
      return;
    }

    const scheduledAt = new Date();
    scheduledAt.setMinutes(scheduledAt.getMinutes() + delayMinutes);

    const { data, error } = await supabaseAdmin
      .from('automation_queue')
      .insert({
        event_type: eventType,
        payload: payload,
        status: 'pending',
        scheduled_at: scheduledAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    
    // Only execute immediately if not delayed
    if (delayMinutes === 0) {
      executeAutomation(data.id, eventType, payload);
    }
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

/**
 * IN-APP NOTIFICATION HELPER
 */
const insertNotification = async (userId: string, title: string, body: string, type: string, link?: string, priority: string = 'info') => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return;

    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      title: title,
      body: body,
      type: type,
      link: link,
      priority: priority
    });
  } catch (err) {
    console.error("Failed to insert in-app notification:", err);
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
        // 🛡️ PHASE 2: In-App Notification
        if (payload.userId) {
          await insertNotification(
            payload.userId, 
            'Welcome to NeuroChiro! 🧠', 
            'Your account is active. Complete your profile to get the most out of the platform.',
            'system',
            '/settings'
          );
        }

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
            body = `<h1>Welcome ${payload.name || payload.full_name || ''},</h1>
                    <p>You're now part of the NeuroChiro Student Network — a global community helping chiropractic students build powerful careers.</p>
                    <p>Inside your dashboard you can now:</p>
                    <ul>
                      <li>Evaluate associate contracts</li>
                      <li>Compare job offers</li>
                      <li>Access negotiation tools</li>
                      <li>Discover seminars and training events</li>
                      <li>Connect with clinics looking for graduates</li>
                    </ul>
                    <p>Your next step: Complete your student profile so we can match you with the right opportunities.</p>`;
            ctaText = 'Complete My Profile';
            ctaUrl = 'https://neurochiro.co/student/profile';

            // Enqueue subsequent emails in the sequence
            await enqueue('student_career_accelerator', payload, 24 * 60); // 24 hours later
            await enqueue('student_opportunity_engine', payload, 3 * 24 * 60); // 3 days later
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
          let query = supabaseAdmin.from('profiles').select('email, role, subscription_tier, id');
          
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

                // 🛡️ PHASE 2: In-App Announcement
                await insertNotification(u.id, payload.subject, 'A new announcement has been published.', 'announcement', '/announcements');
              }
            }
          }
        }
        break;

      case 'student_career_accelerator':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Accelerate Your Chiropractic Career 🚀',
            title: 'Career Tools Unlocked',
            body: `<h1>Ready to lead, ${payload.name || payload.full_name || ''}?</h1>
                   <p>We've built proprietary tools to help you navigate the transition from student to elite practitioner:</p>
                   <ul>
                     <li><strong>Contract Lab:</strong> Decode any associate agreement in seconds.</li>
                     <li><strong>Offer Evaluation Tool:</strong> Compare multiple offers side-by-side.</li>
                     <li><strong>Negotiation Guide:</strong> Exact scripts to increase your starting value.</li>
                   </ul>`,
            ctaText: 'Explore Career Tools',
            ctaUrl: 'https://neurochiro.co/student/dashboard'
          });
        }
        break;

      case 'student_opportunity_engine':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Your Future Clinic is Waiting 🏢',
            title: 'Opportunity Engine',
            body: `<h1>Don't wait until graduation, ${payload.name || payload.full_name || ''}.</h1>
                   <p>The NeuroChiro network is full of high-volume, nervous-system-focused clinics looking for their next associate.</p>
                   <p>Maximize your visibility by uploading your resume and attending upcoming seminars.</p>`,
            ctaText: 'View Job Board',
            ctaUrl: 'https://neurochiro.co/student/jobs'
          });
        }
        break;

      case 'membership_upgrade':
        // 🛡️ PHASE 2: In-App Notification
        if (payload.userId) {
          await insertNotification(payload.userId, 'Tier Upgraded! 🎉', `Welcome to ${payload.tierName}. Your new tools are now unlocked.`, 'system', '/doctor/dashboard', 'important');
        }

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
        // 🛡️ PHASE 2: In-App Notification
        if (payload.userId) {
          await insertNotification(payload.userId, 'New Referral Received! 📍', `Dr. ${payload.referrerName} sent you a new patient referral: ${payload.patientName}.`, 'referral', '/doctor/messages', 'urgent');
        }

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
        // 🛡️ PHASE 2: In-App Notification
        if (payload.userId) {
          await insertNotification(payload.userId, 'Registration Confirmed', `You are confirmed for ${payload.eventName}. Check your dashboard for access details.`, 'system', '/dashboard');
        }

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

      case 'seminar_approved':
        if (payload.userId) {
          await insertNotification(payload.userId, 'Seminar Approved! 🚀', `Your seminar "${payload.seminarTitle}" is now live in the marketplace.`, 'system', '/doctor/seminars', 'important');
        }
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: `Your Seminar is LIVE! 🚀`,
            title: 'Seminar Approved',
            body: `<p>Congratulations! Your seminar <strong>${payload.seminarTitle}</strong> has been approved and is now live in the NeuroChiro marketplace.</p>`,
            ctaText: 'View My Seminars',
            ctaUrl: 'https://neurochiro.co/doctor/seminars'
          });
        }
        break;

      case 'seminar_rejected':
        if (payload.userId) {
          await insertNotification(payload.userId, 'Seminar Submission Update', `Your seminar submission requires changes. Check admin notes.`, 'system', '/doctor/seminars', 'urgent');
        }
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: `Action Required: Seminar Submission Update`,
            title: 'Seminar Update',
            body: `<p>Your seminar submission for <strong>${payload.seminarTitle}</strong> requires some changes before it can be approved.</p><p><strong>Admin Notes:</strong> ${payload.notes || 'No notes provided.'}</p>`,
            ctaText: 'Edit Submission',
            ctaUrl: 'https://neurochiro.co/doctor/seminars'
          });
        }
        break;

      case 'job_application':
        // 🛡️ PHASE 2: In-App Notifications for Applicant and Doctor
        if (payload.userId) {
          await insertNotification(payload.userId, 'Application Sent Successfully', `Your application for ${payload.jobTitle} has been submitted.`, 'job', '/student/jobs');
        }
        
        // Find doctor userId if possible (in production we'd pass doctorUserId in payload)
        if (payload.doctorEmail && supabaseAdmin) {
           const { data: doctorProfile } = await supabaseAdmin.from('profiles').select('id').eq('email', payload.doctorEmail).single();
           if (doctorProfile) {
              await insertNotification(doctorProfile.id, 'New Applicant! 🧠', `A candidate has applied for your ${payload.jobTitle} position.`, 'job', '/doctor/jobs', 'important');
           }
        }

        if (emailEnabled && payload.email) {
          // Notify Applicant
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Application Submitted Successfully',
            title: 'Talent Marketplace',
            body: `<p>Your application for <strong>${payload.jobTitle}</strong> has been successfully submitted. The clinic will review your profile and reach out directly.</p>`,
            ctaText: 'Explore More Jobs',
            ctaUrl: 'https://neurochiro.co/marketplace'
          });

          // 🛡️ PHASE 1: Notify Hiring Doctor
          if (payload.doctorEmail) {
            await sendPremiumEmail({
              to: payload.doctorEmail,
              subject: 'New Job Application Received! 🧠',
              title: 'Hiring Update',
              body: `<p>A candidate has applied for your position: <strong>${payload.jobTitle}</strong>.</p><p>Review their profile and clinical experience in your Talent Command center.</p>`,
              ctaText: 'Review Applicant',
              ctaUrl: 'https://neurochiro.co/doctor/jobs'
            });
          }
        }
        break;

      case 'payment_warning':
        // 🛡️ PHASE 2: In-App Notification
        if (payload.userId) {
          await insertNotification(payload.userId, 'Payment Overdue ⚠️', 'Your directory listing is at risk. Update your billing immediately.', 'system', '/doctor/settings', 'urgent');
        }

        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Action Required: Your directory listing is at risk',
            title: 'Payment Warning',
            body: `<p>Hi ${payload.name || 'Doctor'}, your payment is now 3 days past due. To prevent your clinic from being hidden on the global map, please update your billing information immediately.</p>`,
            ctaText: 'Secure My Listing',
            ctaUrl: 'https://neurochiro.co/doctor/settings'
          });
        }
        break;
        
      case 'payment_success':
        if (supabaseAdmin && payload.stripeData) {
          const data = payload.stripeData;
          // In checkout.session, userId is in client_reference_id
          // In invoice, we usually find customer, and might have subscription metadata
          const customerId = data.customer;
          const userId = data.client_reference_id; // For checkout session
          
          if (userId) {
            await supabaseAdmin.from('profiles').update({
              stripe_customer_id: customerId,
              subscription_status: 'active'
            }).eq('id', userId);
            
            const { data: profile } = await supabaseAdmin.from('profiles').select('role, full_name, email').eq('id', userId).single();
            if (profile?.role === 'doctor') {
               await supabaseAdmin.from('doctors').update({ verification_status: 'verified' }).eq('user_id', userId);
               
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
          } else if (customerId) {
            // Handle renewal via customerId
            await supabaseAdmin.from('profiles').update({
              subscription_status: 'active'
            }).eq('stripe_customer_id', customerId);
          }
        }
        break;

      case 'subscription_updated':
        if (supabaseAdmin && payload.stripeData) {
          const sub = payload.stripeData;
          const customerId = sub.customer;
          // You would typically map Stripe Price IDs to your internal tiers here
          // For now we update the status
          if (customerId) {
            await supabaseAdmin.from('profiles').update({
              subscription_status: sub.status
            }).eq('stripe_customer_id', customerId);
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
                await supabaseAdmin.from('doctors').update({ verification_status: 'hidden' }).eq('user_id', profile.id);
              }
            }
          }
        }
        break;

      case 'unread_message_email':
        if (supabaseAdmin && emailEnabled) {
          const { recipient_id, sender_id } = payload;
          const { data: recipient } = await supabaseAdmin.from('profiles').select('email, full_name, role').eq('id', recipient_id).single();
          const { data: sender } = await supabaseAdmin.from('profiles').select('full_name').eq('id', sender_id).single();
          
          if (recipient?.email) {
            const dashboardUrl = recipient.role === 'student' ? 'https://neurochiro.co/student/messages' : 'https://neurochiro.co/doctor/messages';
            await sendPremiumEmail({
              to: recipient.email,
              subject: `New Message from ${sender?.full_name || 'a member'}`,
              title: 'New Message',
              body: `<p>Hi ${recipient.full_name || 'Member'}, you have a new unread message from ${sender?.full_name || 'someone in the network'}. Please log in to reply to keep the conversation active.</p>`,
              ctaText: 'View Message',
              ctaUrl: dashboardUrl
            });
          }
        }
        break;

      case 'daily_talent_drop':
        if (supabaseAdmin) {
          // 1. Get all Growth & Pro Tier Doctors
          const { data: doctors } = await supabaseAdmin
            .from('profiles')
            .select('id, full_name, phone, subscription_tier')
            .eq('role', 'doctor')
            .in('subscription_tier', ['growth', 'pro', 'elite']);

          if (doctors && doctors.length > 0) {
            for (const doc of doctors) {
              // 2. Get 3 top matching students (simplified logic: top readiness scores)
              const { data: students } = await supabaseAdmin
                .from('students')
                .select('name, school, interests')
                .order('readiness_score', { ascending: false })
                .limit(3);

              if (students && students.length > 0 && doc.phone) {
                const studentNames = students.map(s => `${s.name} (${s.school.split(' ')[0]})`).join(', ');
                const primaryInterest = students[0].interests[0] || "Neuro-Chiropractic";
                
                const message = `Dr. ${doc.full_name.split(' ').pop()}, 3 new 90%+ readiness candidates entered the 'Graduating Soon' window. ${students[0].name} is a perfect match for your ${primaryInterest} focus. View & Invite: neurochiro.co/doctor/students`;
                
                await sendSMS(doc.phone, message);
                
                // Also send in-app notification
                await insertNotification(
                  doc.id,
                  'New Talent Drop! 🧠',
                  `We found ${students.length} high-readiness candidates matching your clinic profile.`,
                  'job',
                  '/doctor/students',
                  'important'
                );
              }
            }
          }
        }
        break;

      case 'admin_notification':
        if (process.env.NODE_ENV !== 'development') {
          await resend.emails.send({
            from: 'NeuroChiro System <support@neurochirodirectory.com>',
            to: 'support@neurochirodirectory.com',
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
  onSignup: async (userId: string, email: string, name: string, role: string, phone?: string) => {
    await enqueue('welcome_email', { userId, email, name, role, phone });
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
  onJobApplication: async (applicantId: string, email: string, jobId: string, jobTitle: string, doctorEmail: string) => { 
    await enqueue('job_application', { userId: applicantId, email, jobId, jobTitle, doctorEmail });
  },
  onPaymentWarning: async (userId: string, email: string, name: string) => {
    await enqueue('payment_warning', { userId, email, name });
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
  onSeminarApproved: async (userId: string, email: string, seminarTitle: string) => {
    await enqueue('seminar_approved', { userId, email, seminarTitle });
  },
  onSeminarRejected: async (userId: string, email: string, seminarTitle: string, notes: string) => {
    await enqueue('seminar_rejected', { userId, email, seminarTitle, notes });
  },
  onCampaignCreated: async (userId: string, campaignName: string) => {
    await enqueue('admin_notification', { subject: 'New Campaign Created', html: `<p>User <strong>${userId}</strong> created a new campaign: <strong>${campaignName}</strong>.</p>`});
  },
  triggerDailyTalentDrop: async () => {
    await enqueue('daily_talent_drop', {});
  },
  onPaymentSuccess: async (data: any) => {
    await enqueue('payment_success', { stripeData: data });
  },
  onPaymentFailed: async (data: any) => {
    await enqueue('payment_failed', { stripeData: data });
  },
  onSubscriptionUpdated: async (data: any) => {
    await enqueue('subscription_updated', { stripeData: data });
  },
  onSubscriptionCanceled: async (data: any) => {
    await enqueue('subscription_canceled', { stripeData: data });
  },
  retryAutomation: async (queueId: string) => {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) return { error: "No Supabase Admin Client" };

    const { data: job, error: fetchError } = await supabaseAdmin
      .from('automation_queue')
      .update({ status: 'processing', updated_at: new Date().toISOString() })
      .eq('id', queueId)
      .select()
      .single();

    if (fetchError || !job) return { error: fetchError?.message || "Job not found" };

    try {
      await executeAutomation(job.id, job.event_type, job.payload);
      return { success: true };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Unknown error' };
    }
  }
};
