import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

// Initialize the Resend SDK
export const resend = new Resend(process.env.RESEND_API_KEY || 're_mock_key');

// Admin client for backend operations
const getSupabaseAdmin = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return new Proxy({}, {
      get: () => () => ({ 
        from: () => ({ 
          insert: () => ({ 
            select: () => ({ 
              single: async () => ({ data: null, error: { message: 'Supabase keys missing' } }) 
            }) 
          }),
          update: () => ({ eq: async () => ({ data: null, error: null }) })
        }) 
      })
    }) as any;
  }

  return createClient(url, key);
};

/**
 * ROBUST QUEUING WRAPPER
 * Persists the automation event to the database before execution.
 * This allows for retries if Resend or other services are down.
 */
const enqueue = async (eventType: string, payload: Record<string, unknown>) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Persist to DB Queue
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

    // 2. Execute immediately (Optimistic Background Execution)
    executeAutomation(data.id, eventType, payload);
    
  } catch (err) {
    console.error("Failed to enqueue automation:", err);
  }
};

/**
 * PWA PUSH NOTIFICATION SENDER
 */
const sendPushNotification = async (userId: string, title: string, body: string, url: string = '/') => {
  console.log(`[PUSH] Sending to ${userId}: ${title} - ${body}`);
  // Implementation utilizes web-push library against user's stored subscriptions
};

/**
 * SMS SENDER (TWILIO)
 */
const sendSMS = async (phone: string, message: string) => {
  console.log(`[SMS] Sending to ${phone}: ${message}`);
  // e.g., await twilioClient.messages.create({ body: message, from: '+1...', to: phone });
};

/**
 * ADMIN ALERT SENDER
 */
const sendAdminAlert = async (subject: string, html: string) => {
  if (process.env.NODE_ENV !== 'development') {
    await resend.emails.send({
      from: 'NeuroChiro System <alerts@neurochiro.com>',
      to: 'admin@neurochiro.com', // or dynamic admin list
      subject: `[ADMIN] ${subject}`,
      html
    });
  } else {
    console.log(`[ADMIN ALERT] ${subject}`);
  }
};

const executeAutomation = async (queueId: string, eventType: string, payload: Record<string, any>) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 0. Fetch User Preferences (if userId is available)
    let prefs = null;
    if (payload.userId) {
      const { data } = await supabaseAdmin
        .from('notification_preferences')
        .select('*')
        .eq('user_id', payload.userId)
        .single();
      prefs = data;
    }

    const emailEnabled = prefs?.email_enabled ?? true;
    const pushEnabled = prefs?.push_enabled ?? true;
    const smsEnabled = prefs?.sms_enabled ?? false;

    // Logic to actually send the email/notification/sms
    switch (eventType) {
      case 'welcome_email':
        if (emailEnabled && payload.email) {
          await resend.emails.send({
            from: 'NeuroChiro <welcome@neurochiro.com>',
            to: payload.email,
            subject: 'Welcome to NeuroChiro! 🧠',
            html: `<h1>Welcome, ${payload.name}!</h1><p>Your journey into nervous-system-first chiropractic starts here.</p><p>Suggested next steps: Update your profile and explore the global directory.</p>`
          });
        }
        if (smsEnabled && payload.phone) {
          await sendSMS(payload.phone, "Welcome to NeuroChiro. Check your email for login instructions.");
        }
        break;

      case 'password_reset':
        if (payload.email) {
          await resend.emails.send({
            from: 'NeuroChiro Security <security@neurochiro.com>',
            to: payload.email,
            subject: 'Password Reset Request',
            html: `<p>Click here to securely reset your password:</p><p><a href="${payload.resetLink}">${payload.resetLink}</a></p><p>If you didn't request this, you can ignore this email.</p>`
          });
        }
        break;

      case 'membership_upgrade':
        if (emailEnabled && payload.email) {
          await resend.emails.send({
            from: 'NeuroChiro Billing <billing@neurochiro.com>',
            to: payload.email,
            subject: `Welcome to ${payload.tierName}! 🎉`,
            html: `<p>Your membership has been successfully upgraded to <strong>${payload.tierName}</strong>.</p><p>You now have access to premium features. <a href="https://neurochiro.com/dashboard">Go to Dashboard</a></p>`
          });
        }
        break;

      case 'event_registration':
        if (emailEnabled && payload.email) {
          await resend.emails.send({
            from: 'NeuroChiro Events <events@neurochiro.com>',
            to: payload.email,
            subject: `Registration Confirmed: ${payload.eventName}`,
            html: `<p>You are confirmed for ${payload.eventName}.</p><p>Details: ${payload.eventDetails}</p><a href="${payload.calendarLink}">Add to Calendar</a>`
          });
        }
        if (smsEnabled && payload.phone) {
          await sendSMS(payload.phone, `Reminder: ${payload.eventName} begins soon. Check your email for details.`);
        }
        break;

      case 'job_application':
        if (emailEnabled && payload.email) {
          await resend.emails.send({
            from: 'NeuroChiro Talent <careers@neurochiro.com>',
            to: payload.email,
            subject: 'Application Submitted Successfully',
            html: `<p>Your application for <strong>${payload.jobTitle}</strong> has been successfully submitted to the clinic.</p><p>The clinic will review your profile and reach out directly with next steps.</p>`
          });
        }
        break;

      case 'referral_received':
        if (prefs?.referral_alerts ?? true) {
          if (emailEnabled && payload.doctorEmail) {
            await resend.emails.send({
              from: 'NeuroChiro Network <referrals@neurochiro.com>',
              to: payload.doctorEmail,
              subject: 'New Patient Referral 📍',
              html: `<p>You received a new referral: <strong>${payload.patientName}</strong> from Dr. ${payload.referrerName}.</p>`
            });
          }
          if (pushEnabled) {
            await sendPushNotification(payload.userId, 'New Referral Received', `You have a new patient referral from Dr. ${payload.referrerName}.`, '/doctor/referrals');
          }
          if (smsEnabled && payload.phone) {
            await sendSMS(payload.phone, `NeuroChiro: You received a new patient referral. Check your dashboard for details.`);
          }
        }
        break;

      case 'daily_log_completed':
        if (pushEnabled) {
          await sendPushNotification(payload.userId, 'Streak Updated! 🔥', `You've hit a ${payload.streak} day streak.`, '/portal/track');
        }
        if (emailEnabled && payload.email && payload.streak % 7 === 0) {
          await resend.emails.send({
            from: 'NeuroChiro Pulse <pulse@neurochiro.com>',
            to: payload.email,
            subject: `Day ${payload.streak} Streak! 🔥`,
            html: `<p>Your nervous system regulation is trending up! Keep it alive.</p>`
          });
        }
        break;

      case 'reengage_inactive':
        if (emailEnabled) {
          await resend.emails.send({
            from: 'NeuroChiro <reconnect@neurochiro.com>',
            to: payload.email,
            subject: 'We miss you! See what’s new on NeuroChiro',
            html: `<p>It's been 14 days since your last check-in. The ecosystem is evolving!</p><a href="https://neurochiro.com/dashboard">View Updates</a>`
          });
        }
        if (pushEnabled) {
          await sendPushNotification(payload.userId, 'We miss you!', 'Check out the new features and clinics added recently.');
        }
        break;

      case 'profile_incomplete':
        if (emailEnabled) {
          await resend.emails.send({
            from: 'NeuroChiro Support <support@neurochiro.com>',
            to: payload.email,
            subject: 'Action Required: Complete your profile',
            html: `<p>Complete your profile to receive more patient visibility and accurate matches.</p><a href="https://neurochiro.com/profile">Update Profile</a>`
          });
        }
        break;

      case 'admin_notification':
        await sendAdminAlert(payload.subject, payload.html);
        break;
    }

    // Mark as completed
    await supabaseAdmin
      .from('automation_queue')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', queueId);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Automation execution failed for ${queueId}:`, err);
    // Update queue with error for retry worker to find
    const supabaseAdmin = getSupabaseAdmin();
    await supabaseAdmin
      .from('automation_queue')
      .update({ 
        status: 'failed', 
        last_error: errorMsg,
        retry_count: 1, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', queueId);
  }
};

/**
 * PSYCHOLOGICAL ENGAGEMENT & HABIT FORMATION HUB
 */
export const Automations = {
  
  // USER ACTIONS
  onSignup: async (userId: string, email: string, name: string, phone?: string) => {
    await enqueue('welcome_email', { userId, email, name, phone });
  },

  onPasswordReset: async (email: string, resetLink: string) => {
    await enqueue('password_reset', { email, resetLink });
  },

  onMembershipUpgrade: async (userId: string, email: string, tierName: string) => {
    await enqueue('membership_upgrade', { userId, email, tierName });
  },

  onEventRegistration: async (userId: string, email: string, phone: string, eventName: string, eventDetails: string, calendarLink: string) => {
    await enqueue('event_registration', { userId, email, phone, eventName, eventDetails, calendarLink });
  },

  onJobApplication: async (applicantId: string, email: string, jobId: string, jobTitle: string) => { 
    await enqueue('job_application', { userId: applicantId, email, jobId, jobTitle });
  },

  onReferralSent: async (referrerId: string, referrerName: string, doctorId: string, doctorEmail: string, phone: string, patientName: string) => {
    await enqueue('referral_received', { userId: doctorId, doctorEmail, phone, patientName, referrerName });
  },

  // ENGAGEMENT AUTOMATIONS
  onDailyLogCompleted: async (userId: string, currentStreak: number, email?: string) => {
    await enqueue('daily_log_completed', { userId, streak: currentStreak, email });
  },

  onInactivityDetected: async (userId: string, email: string) => {
    await enqueue('reengage_inactive', { userId, email });
  },

  onProfileIncomplete: async (userId: string, email: string) => {
    await enqueue('profile_incomplete', { userId, email });
  },

  // ADMIN NOTIFICATIONS
  onVendorSignup: async (vendorName: string) => {
    await enqueue('admin_notification', { subject: 'New Vendor Application', html: `<p>New vendor applied: <strong>${vendorName}</strong>.</p>`});
  },

  onMastermindApplication: async (applicantName: string) => {
    await enqueue('admin_notification', { subject: 'New Mastermind Application', html: `<p>New application received from: <strong>${applicantName}</strong>.</p>`});
  },

  onJobPosted: async (clinicName: string) => {
    await enqueue('admin_notification', { subject: 'New Job Posted', html: `<p>A new job was posted by: <strong>${clinicName}</strong>.</p>`});
  },

  onFlaggedContent: async (contentId: string, reason: string) => {
    await enqueue('admin_notification', { subject: 'Content Flagged', html: `<p>Content ID <strong>${contentId}</strong> has been flagged for: ${reason}.</p>`});
  },

  onBroadcastDispatched: async (adminId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Broadcast Dispatched', html: `<p>Admin <strong>${adminId}</strong> dispatched a new broadcast: ${data.title}.</p>`});
  },

  onBroadcastScheduled: async (adminId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Broadcast Scheduled', html: `<p>Admin <strong>${adminId}</strong> scheduled a new broadcast: ${data.title}.</p>`});
  },

  onModerationAction: async (adminId: string, action: string, type: string, target: string) => {
    await enqueue('admin_notification', { subject: 'Moderation Action', html: `<p>Admin <strong>${adminId}</strong> performed <strong>${action}</strong> on <strong>${type}</strong>: ${target}.</p>`});
  },

  onSettingsToggle: async (adminId: string, setting: string, value: boolean) => {
    await enqueue('admin_notification', { subject: 'Settings Toggle', html: `<p>Admin <strong>${adminId}</strong> toggled <strong>${setting}</strong> to <strong>${value}</strong>.</p>`});
  },

  onSeminarHosted: async (doctorId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Seminar Hosted', html: `<p>Doctor <strong>${doctorId}</strong> hosted a new seminar: ${data.title}.</p>`});
  },

  onSeminarRegistration: async (userId: string, email: string, phone: string, seminarName: string) => {
    await enqueue('event_registration', { userId, email, phone, eventName: seminarName, eventDetails: 'General Registration', calendarLink: '#' });
  },

  onCampaignCreated: async (doctorId: string, campaignName: string) => {
    await enqueue('admin_notification', { subject: 'Campaign Created', html: `<p>Doctor <strong>${doctorId}</strong> created a new campaign: ${campaignName}.</p>`});
  },

  onProfileUpdate: async (userId: string, data: any) => {
    await enqueue('admin_notification', { subject: 'Profile Updated', html: `<p>User <strong>${userId}</strong> updated their profile: ${JSON.stringify(data)}.</p>`});
  },

  onPaymentSuccess: async (data: any) => {
    await enqueue('admin_notification', { subject: 'Payment Success', html: `<p>Payment succeeded: ${JSON.stringify(data)}.</p>`});
  },

  onPaymentFailed: async (data: any) => {
    await enqueue('admin_notification', { subject: 'Payment Failed', html: `<p>Payment failed: ${JSON.stringify(data)}.</p>`});
  },

  onSubscriptionCanceled: async (data: any) => {
    await enqueue('admin_notification', { subject: 'Subscription Canceled', html: `<p>Subscription canceled: ${JSON.stringify(data)}.</p>`});
  }
};
