import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';

/**
 * LAZY RESEND LOADER
 * Ensures environment variables are loaded before initialization
 */
let _resend: Resend | null = null;
const getResendClient = () => {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');
  }
  return _resend;
};

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

/**
 * DISCORD WEBHOOK WORKER
 */
const sendDiscordNotification = async (message: string) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log(`[DISCORD MOCK] ${message}`);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: message })
    });
  } catch (err) {
    console.error("Failed to send Discord notification:", err);
  }
};

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
const sendPremiumEmail = async (options: { 
  to: string, 
  subject: string, 
  title: string, 
  body: string, 
  ctaText?: string, 
  ctaUrl?: string,
  secondaryCtaText?: string,
  secondaryCtaUrl?: string
}) => {
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
        .btn { display: inline-block; background-color: #D66829; color: #FFFFFF !important; padding: 20px 40px; text-decoration: none; border-radius: 18px; font-weight: 900; font-size: 15px; text-transform: uppercase; letter-spacing: 2px; box-shadow: 0 10px 30px rgba(214, 104, 41, 0.2); margin: 10px; }
        .btn-secondary { background-color: #1E2D3B; box-shadow: 0 10px 30px rgba(30, 45, 59, 0.2); }
        h1 { font-weight: 900; color: #0B1118; font-size: 28px; line-height: 1.2; margin-bottom: 25px; }
        p { font-size: 17px; line-height: 1.7; color: #4B5563; }
        ul { padding-left: 20px; color: #4B5563; }
        li { margin-bottom: 10px; font-size: 16px; }
        .footer { text-align: center; padding: 40px; font-size: 12px; color: #9CA3AF; letter-spacing: 1px; text-transform: uppercase; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="wrapper">
        <div class="header">
          <img src="https://neurochiro.co/logo.png" alt="NeuroChiro" width="120" style="display: block; margin: 0 auto;">
        </div>
        <div class="content">
          <div style="text-transform: uppercase; color: #D66829; font-weight: 900; letter-spacing: 3px; font-size: 11px; margin-bottom: 15px;">${options.title}</div>
          ${options.body}
          <div style="text-align: center; margin-top: 50px;">
            ${options.ctaText && options.ctaUrl ? `<a href="${options.ctaUrl}" class="btn">${options.ctaText}</a>` : ''}
            ${options.secondaryCtaText && options.secondaryCtaUrl ? `<a href="${options.secondaryCtaUrl}" class="btn btn-secondary">${options.secondaryCtaText}</a>` : ''}
          </div>
        </div>
        <div class="footer">
          &copy; 2026 NeuroChiro Network. All Rights Reserved.
        </div>
      </div>
    </body>
    </html>
  `;

  return getResendClient().emails.send({
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

    const { data, error } = await supabaseAdmin
      .from('automation_queue')
      .insert({
        event_type: eventType,
        payload: payload,
        status: 'pending',
        created_at: new Date().toISOString()
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
            // High-Precision Geocoding: Combine City, State, and Country
            const searchQuery = [payload.city, payload.state, payload.country]
              .filter(Boolean)
              .join(', ');

            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
            const data = await response.json();
            
            if (data && data.length > 0) {
              const lat = parseFloat(data[0].lat);
              const lng = parseFloat(data[0].lon);
              
              await supabaseAdmin.from('doctors').update({
                latitude: lat,
                longitude: lng,
                // Also update city/state/country if provided to keep records clean
                city: payload.city,
                state: payload.state || null,
                country: payload.country || 'United States'
              }).eq('user_id', payload.userId);
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

        // Notify Admins via Discord
        await sendDiscordNotification(`🆕 New ${payload.role} joined the network: **${payload.name || payload.full_name || 'Anonymous'}** (${payload.email})`);

        if (emailEnabled && payload.email) {
          if (payload.role === 'doctor') {
            await sendPremiumEmail({ 
              to: payload.email, 
              subject: 'Welcome to the NeuroChiro Network 🌍', 
              title: 'Doctor Account Created', 
              body: `<h1>Welcome Dr. ${payload.name || payload.full_name || ''},</h1><p>Your directory profile has been created. To start receiving referrals and join the global map, complete your clinic profile and finalize your membership.</p>`, 
              ctaText: 'Setup My Profile', 
              ctaUrl: 'https://neurochiro.co/onboarding' 
            });

            // Enqueue abandoned checkout / profile reminder
            await enqueue('doctor_profile_reminder', payload, 2 * 60); // 2 hours later
            await enqueue('doctor_growth_upsell', payload, 3 * 24 * 60); // 3 days later
          } else if (payload.role === 'student') {
            await sendPremiumEmail({ 
              to: payload.email, 
              subject: 'Welcome to NeuroChiro Student Network 🎓', 
              title: 'Student Account Created', 
              body: `<h1>Welcome ${payload.name || payload.full_name || ''},</h1>
                    <p>You're now part of the NeuroChiro Student Network — a global community helping chiropractic students build powerful careers.</p>
                    <p>Inside your dashboard you can now:</p>
                    <ul>
                      <li>Evaluate associate contracts</li>
                      <li>Compare job offers</li>
                      <li>Access negotiation tools</li>
                      <li>Discover seminars and training events</li>
                      <li>Connect with clinics looking for graduates</li>
                    </ul>
                    <p>Your next step: Complete your student profile so we can match you with the right opportunities.</p>`, 
              ctaText: 'Complete My Profile', 
              ctaUrl: 'https://neurochiro.co/student/profile',
              secondaryCtaText: 'Explore Career Tools',
              secondaryCtaUrl: 'https://neurochiro.co/student/dashboard'
            });

            // Enqueue subsequent emails in the sequence
            await enqueue('student_career_accelerator', payload, 24 * 60); // 24 hours later
            await enqueue('student_opportunity_engine', payload, 3 * 24 * 60); // 3 days later
          } else if (payload.role === 'vendor') {
            await sendPremiumEmail({
              to: payload.email,
              subject: 'Welcome to NeuroChiro Marketplace 🏢',
              title: 'Vendor Account Created',
              body: `<h1>Welcome to the NeuroChiro Vendor Partner Network.</h1>
                     <p>You now have access to a global directory of elite, neuro-focused chiropractors who are actively seeking top-tier products and services for their clinics.</p>
                     <p>Your next step is to complete your vendor profile so we can get your listing approved and live on the marketplace.</p>
                     <ul>
                        <li>Add your company logo and description</li>
                        <li>Submit your exclusive NeuroChiro Pro offer</li>
                        <li>Wait for admin approval to go live</li>
                     </ul>`,
              ctaText: 'Complete Vendor Profile',
              ctaUrl: 'https://neurochiro.co/vendor/dashboard',
              secondaryCtaText: 'View Marketplace',
              secondaryCtaUrl: 'https://neurochiro.co/marketplace'
            });

            // Enqueue subsequent vendor onboarding emails
            await enqueue('vendor_profile_reminder', payload, 24 * 60); // 24 hours later
            await enqueue('vendor_optimization_tips', payload, 3 * 24 * 60); // 3 days later
          } else {
            // Patient / Public / Default
            await sendPremiumEmail({
              to: payload.email,
              subject: 'Your Journey to True Healing Starts Here 🌱',
              title: 'Account Activated',
              body: `<h1>Welcome to NeuroChiro, ${payload.name || payload.full_name || 'there'}.</h1>
                    <p>Understanding your nervous system is the first step to true healing. You now have access to a global network of elite, nervous-system-first chiropractors.</p>
                    <p>Inside your patient portal, you can:</p>
                    <ul>
                      <li>Search the global directory for verified specialists near you.</li>
                      <li>Access educational resources about nervous system regulation.</li>
                      <li>Track your health journey and clinical progress.</li>
                    </ul>
                    <p>Your next step is to find a practitioner who can help you reach your goals.</p>`,
              ctaText: 'Find a Doctor Now',
              ctaUrl: 'https://neurochiro.co/directory'
            });

            // Enqueue Patient Onboarding Sequence
            await enqueue('patient_education_1', payload, 24 * 60); // 1 day later
            await enqueue('patient_directory_reminder', payload, 3 * 24 * 60); // 3 days later
          }
        }
        if (smsEnabled && payload.phone) {
          await sendSMS(payload.phone, `Welcome to NeuroChiro! Your account is active. Log in at neurochiro.co/login`);
        }
        break;

        case 'vendor_profile_reminder':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Action Required: Complete Your Vendor Profile ⚠️',
            title: 'Profile Incomplete',
            body: `<h1>Don't miss out on exposure, ${payload.name || 'Partner'}.</h1>
                   <p>Your vendor profile is currently incomplete. Active listings receive significantly more clicks and direct inquiries from our network of chiropractors.</p>
                   <p>Take 5 minutes to add your company details, logo, and a special offer for NeuroChiro members.</p>`,
            ctaText: 'Complete Profile Now',
            ctaUrl: 'https://neurochiro.co/vendor/dashboard'
          });
        }
        break;

        case 'vendor_optimization_tips':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'How to stand out in the NeuroChiro Marketplace 🚀',
            title: 'Marketplace Optimization',
            body: `<h1>Maximize Your ROI, ${payload.name || 'Partner'}.</h1>
                   <p>Now that you are part of the NeuroChiro Vendor Network, here are the top 3 ways to get noticed by high-volume clinics:</p>
                   <ul>
                      <li><strong>Exclusive Offers:</strong> Vendors providing a "NeuroChiro Pro" discount see a 300% increase in clicks.</li>
                      <li><strong>Clear ROI:</strong> Explain exactly how your product saves time, increases revenue, or improves patient outcomes.</li>
                      <li><strong>Rich Media:</strong> Ensure your logo is high-resolution and your description is compelling.</li>
                   </ul>`,
            ctaText: 'Optimize Listing',
            ctaUrl: 'https://neurochiro.co/vendor/dashboard'
          });
        }
        break;

        case 'student_career_accelerator':
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
          let query = supabaseAdmin.from('profiles').select('email, role, tier, id');
          
          if (payload.audience !== 'all') {
            if (payload.audience === 'paid_doctors') {
              query = query.eq('role', 'doctor').in('tier', ['pro', 'elite']);
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

      case 'patient_education_1':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Why the Nervous System Matters 🧠',
            title: 'NeuroChiro Education',
            body: `<h1>Hi ${payload.name || payload.full_name || 'there'}, let's talk about the master controller.</h1>
                   <p>Most people think chiropractic is just for back pain. But your spine protects your nervous system—the system that controls every cell, organ, and function in your body.</p>
                   <p>We've put together a quick guide to help you understand how nervous-system-focused care can unlock true health.</p>`,
            ctaText: 'Read the Guide',
            ctaUrl: 'https://neurochiro.co/learn'
          });
        }
        break;

      case 'patient_directory_reminder':
        if (emailEnabled && payload.email) {
          await sendPremiumEmail({
            to: payload.email,
            subject: 'Find your clinical partner today 📍',
            title: 'Directory Match',
            body: `<h1>${payload.name || payload.full_name || 'Hi'}, are you ready to take the next step?</h1>
                   <p>Our global directory is filled with rigorously vetted, nervous-system-first practitioners.</p>
                   <p>You can search by city, condition, or clinical specialty. Don't wait to start your healing journey.</p>`,
            ctaText: 'Search the Directory',
            ctaUrl: 'https://neurochiro.co/directory'
          });
        }
        break;

      case 'doctor_profile_reminder':
        if (supabaseAdmin && emailEnabled && payload.email && payload.userId) {
           // Check if they already paid/completed
           const { data: profile } = await supabaseAdmin.from('profiles').select('tier').eq('id', payload.userId).single();
           if (!profile || profile.tier === 'free' || profile.tier === null) {
              await sendPremiumEmail({
                to: payload.email,
                subject: 'Did you forget something? 🌍',
                title: 'Incomplete Registration',
                body: `<h1>Dr. ${payload.name || payload.full_name || ''}, your clinic is missing from the map.</h1>
                       <p>You started setting up your NeuroChiro directory profile, but haven't finalized your membership yet.</p>
                       <p>Patients and students are actively searching your area. Complete your setup now to secure your spot.</p>`,
                ctaText: 'Complete Registration',
                ctaUrl: 'https://neurochiro.co/register?role=doctor'
              });
           }
        }
        break;

      case 'doctor_growth_upsell':
        if (supabaseAdmin && emailEnabled && payload.email && payload.userId) {
           const { data: profile } = await supabaseAdmin.from('profiles').select('tier').eq('id', payload.userId).single();
           if (profile && profile.tier === 'starter') {
              await sendPremiumEmail({
                to: payload.email,
                subject: 'Ready to expand your clinical influence? 🚀',
                title: 'Growth Tier Unlock',
                body: `<h1>Dr. ${payload.name || payload.full_name || ''}, level up your practice.</h1>
                       <p>Your Starter tier gets you on the map, but the Growth tier unlocks powerful student recruiting tools, seminar hosting capabilities, and advanced analytics to track your referral sources.</p>
                       <p>Upgrade today and see what the full network can do for your clinic.</p>`,
                ctaText: 'View Upgrade Options',
                ctaUrl: 'https://neurochiro.co/doctor/settings'
              });
           }
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
          const customerId = data.customer;
          const userId = data.client_reference_id; 
          
          if (userId) {
            await supabaseAdmin.from('profiles').update({
              stripe_customer_id: customerId,
            }).eq('id', userId);
            
            const { data: profile } = await supabaseAdmin.from('profiles').select('role, full_name, email').eq('id', userId).single();
            if (profile?.role === 'doctor') {
               await supabaseAdmin.from('doctors').update({ verification_status: 'verified' }).eq('user_id', userId);
               
               // CLEAR CACHE ON SUCCESSFUL INITIAL PAYMENT
               revalidatePath('/doctor/dashboard');
               revalidatePath('/doctor/roi');

               const { count: verifiedCount } = await supabaseAdmin
                 .from('doctors')
                 .select('*', { count: 'exact', head: true })
                 .eq('verification_status', 'verified');

               // Get slug for the link
               const { data: doctorData } = await supabaseAdmin
                 .from('doctors')
                 .select('slug')
                 .eq('user_id', userId)
                 .single();

               const profileLink = doctorData?.slug ? `https://neurochiro.co/directory/${doctorData.slug}` : 'https://neurochiro.co/directory';

               await sendDiscordNotification(`🛡️ **New specialist verified!** Dr. ${profile.full_name || 'Anonymous'}\n📍 Profile: ${profileLink}\n📈 **Total Global Network: ${verifiedCount || 'N/A'}**`);

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
            } else if (profile?.role === 'vendor') {
               if (emailEnabled && profile.email) {
                  await sendPremiumEmail({
                    to: profile.email,
                    subject: 'Payment Received! Awaiting Final Approval ⏳',
                    title: 'Vendor Partner Payment',
                    body: `<p>Hi ${profile.full_name || 'Partner'}, your payment has been successfully processed.</p><p>Our team is reviewing your profile and will approve your listing shortly.</p>`,
                    ctaText: 'Go to Dashboard',
                    ctaUrl: 'https://neurochiro.co/vendor/dashboard'
                  });
               }
               // Notify admins about the paid vendor
               await enqueue('admin_notification', { subject: 'Paid Vendor Application', html: `<p>Vendor <strong>${profile.full_name} (${profile.email})</strong> completed payment and requires approval.</p>` });
            }
          } else if (customerId) {            // Handle renewal via customerId
            // No action needed for now as tier is handled by subscription.updated
          }

        }
        break;

      case 'subscription_updated':
        if (supabaseAdmin && payload.stripeData) {
          const sub = payload.stripeData;
          const customerId = sub.customer;
          const priceId = sub.items?.data?.[0]?.price?.id || '';
          
          // MAP STRIPE PRICE IDs TO TIERS
          const priceToTier: Record<string, string> = {
            'A0q': 'starter',
            'A0s': 'starter',
            'A0p': 'growth',
            'A0r': 'pro'
          };

          // Find match by substring
          const matchedKey = Object.keys(priceToTier).find(key => priceId.includes(key));
          const newTier = matchedKey ? priceToTier[matchedKey] : 'starter';

          if (customerId) {
            const { data: profile } = await supabaseAdmin
              .from('profiles')
              .update({ tier: newTier })
              .eq('stripe_customer_id', customerId)
              .select('id, role')
              .single();

            if (profile?.role === 'doctor') {
               await supabaseAdmin.from('doctors').update({ membership_tier: newTier }).eq('user_id', profile.id);
               revalidatePath('/doctor/dashboard');
               revalidatePath('/doctor/roi');
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
              await supabaseAdmin.from('profiles').update({ tier: 'free' }).eq('id', profile.id);
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
              await supabaseAdmin.from('profiles').update({ tier: 'free' }).eq('id', profile.id);
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
            .select('id, full_name, phone, tier')
            .eq('role', 'doctor')
            .in('tier', ['growth', 'pro', 'elite']);

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
          await getResendClient().emails.send({
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
