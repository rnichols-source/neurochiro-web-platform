import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { Automations } from "@/lib/automations";
import { createServerSupabase } from "@/lib/supabase-server";
import { Resend } from "resend";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;
  const supabase = createServerSupabase();

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      webhookSecret
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 1. IDEMPOTENCY CHECK
  const { data: alreadyProcessed } = await supabase
    .from('processed_webhooks')
    .select('id')
    .eq('id', event.id)
    .single();

  if (alreadyProcessed) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 2. RECORD PROCESSING START
  await supabase.from('processed_webhooks').insert({ id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as any;
        const userId = session.metadata?.userId;
        const customer = session.customer as string;

        if (userId) {
          // Update profile with Stripe customer ID and activate membership
          // Determine tier from the price paid
          const amountPaid = (session.amount_total || 0) / 100;
          const membershipTier = amountPaid >= 199 ? 'pro' : amountPaid >= 99 ? 'growth' : 'starter';

          await supabase
            .from('profiles')
            .update({
              stripe_customer_id: customer,
              subscription_status: 'active',
              tier: membershipTier,
            })
            .eq('id', userId);

          // If user is a doctor, mark as verified
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();

          if (profile?.role === 'doctor') {
            await supabase
              .from('doctors')
              .update({ verification_status: 'verified', membership_tier: membershipTier })
              .eq('user_id', userId);
          }

          // Handle metadata-driven record creation
          const metaType = session.metadata?.type;

          if (metaType === 'vendor') {
            const vendorName = session.metadata?.companyName || session.metadata?.company_name || 'Unnamed Vendor';
            const vendorSlug = vendorName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

            await (supabase as any).from('vendors').insert({
              id: userId,
              name: vendorName,
              slug: vendorSlug,
              short_description: session.metadata?.description || '',
              website_url: session.metadata?.website || '',
              categories: session.metadata?.category ? [session.metadata.category] : [],
              is_active: false,
              tier: 'basic',
            });

            // Confirmation email
            const vendorEmail = session.metadata?.email || session.customer_details?.email;
            if (vendorEmail) {
              try {
                const resend = new Resend(process.env.RESEND_API_KEY || '');
                await resend.emails.send({
                  from: 'NeuroChiro <support@neurochirodirectory.com>',
                  to: [vendorEmail],
                  subject: `Welcome to NeuroChiro Marketplace — ${vendorName}`,
                  html: `
                    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                      <div style="background:#1a2744;padding:28px;text-align:center;">
                        <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Marketplace</h1>
                        <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Application Received!</p>
                      </div>
                      <div style="padding:28px;background:white;">
                        <p style="color:#333;font-size:15px;">Thanks for joining the NeuroChiro Marketplace, <strong>${vendorName}</strong>!</p>
                        <p style="color:#666;line-height:1.6;">Your listing is under review. Our team will activate it within 24 hours. In the meantime:</p>
                        <ol style="color:#666;line-height:1.8;">
                          <li>Log in to your <a href="https://neurochiro.co/vendor/dashboard" style="color:#e97325;font-weight:bold;">Vendor Dashboard</a></li>
                          <li>Upload your company logo</li>
                          <li>Add your exclusive discount for NeuroChiro members</li>
                        </ol>
                        <div style="text-align:center;margin:24px 0;">
                          <a href="https://neurochiro.co/vendor/dashboard" style="display:inline-block;background:#e97325;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">Go to Vendor Dashboard</a>
                        </div>
                      </div>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.error('[WEBHOOK] Vendor email failed:', emailErr);
              }
            }

            // Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `🏢 **NEW VENDOR APPLICATION**\n\n**Company:** ${vendorName}\n**Category:** ${session.metadata?.category || 'N/A'}\n**Website:** ${session.metadata?.website || 'N/A'}\n**Email:** ${session.metadata?.email || 'N/A'}\n**Amount:** $${((session.amount_total || 0) / 100).toFixed(2)}/mo\n**Status:** Pending approval — activate at /admin/marketplace`,
                }),
              }).catch(() => {});
            }
          }

          if (metaType === 'seminar_listing') {
            const seminarTitle = session.metadata?.title || 'Untitled Seminar';
            const seminarLocation = session.metadata?.location || '';
            const seminarDates = session.metadata?.dates || new Date().toISOString();
            const hostEmail = session.metadata?.hostEmail || session.customer_details?.email || '';

            await supabase.from('seminars').insert({
              host_id: userId,
              title: seminarTitle,
              description: session.metadata?.description || '',
              dates: seminarDates,
              location: seminarLocation,
              city: seminarLocation,
              registration_link: session.metadata?.registrationLink || null,
              price: parseFloat(session.metadata?.price || '0') || 0,
              max_capacity: parseInt(session.metadata?.capacity || '0') || null,
              payment_status: 'paid',
              is_approved: false,
              listing_tier: 'basic',
              host_type_at_submission: 'external',
            });

            // Confirmation email
            if (hostEmail) {
              try {
                const resend = new Resend(process.env.RESEND_API_KEY || '');
                await resend.emails.send({
                  from: 'NeuroChiro <support@neurochirodirectory.com>',
                  to: [hostEmail],
                  subject: `Seminar submitted: "${seminarTitle}" — under review`,
                  html: `
                    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                      <div style="background:#1a2744;padding:28px;text-align:center;">
                        <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Seminars</h1>
                        <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Submission Received!</p>
                      </div>
                      <div style="padding:28px;background:white;">
                        <p style="color:#333;font-size:15px;">Your seminar has been submitted and is under review.</p>
                        <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:20px 0;">
                          <p style="margin:0;font-weight:bold;color:#1a2744;">${seminarTitle}</p>
                          <p style="margin:4px 0 0;color:#666;font-size:14px;">${seminarLocation} &middot; ${seminarDates}</p>
                        </div>
                        <p style="color:#666;line-height:1.6;">Our team will review your listing and notify you once it's approved. This typically takes less than 24 hours.</p>
                        <p style="color:#999;font-size:13px;">Questions? Reply to this email.</p>
                      </div>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.error('[WEBHOOK] Seminar listing email failed:', emailErr);
              }
            }

            // Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `📢 **NEW PAID SEMINAR LISTING**\n\n**Title:** ${seminarTitle}\n**Location:** ${seminarLocation}\n**Date:** ${seminarDates}\n**Host Email:** ${hostEmail}\n**Amount:** $${((session.amount_total || 0) / 100).toFixed(2)}\n**Status:** Pending approval`,
                }),
              }).catch(() => {});
            }
          }

          if (metaType === 'course_purchase') {
            const courseId = session.metadata?.courseId;
            if (courseId) {
              await (supabase as any).from('course_purchases').insert({
                user_id: userId,
                course_id: courseId,
                stripe_session_id: session.id,
                amount: session.amount_total,
              });
            }
          }

          if (metaType === 'store_purchase') {
            const productId = session.metadata?.productId;
            if (productId) {
              await (supabase as any).from('course_purchases').insert({
                user_id: userId,
                course_id: productId,
                stripe_session_id: session.id,
                amount: session.amount_total,
              });
            }

            // Confirmation email + Discord for store purchases
            const customerEmail = session.customer_details?.email || session.customer_email || '';
            const customerName = session.customer_details?.name || 'there';
            const productName = session.line_items?.data?.[0]?.description || productId || 'your purchase';
            const amountPaid = ((session.amount_total || 0) / 100).toFixed(2);

            if (customerEmail) {
              try {
                const resend = new Resend(process.env.RESEND_API_KEY || '');
                await resend.emails.send({
                  from: 'NeuroChiro <support@neurochirodirectory.com>',
                  to: [customerEmail],
                  subject: `Your NeuroChiro purchase is ready!`,
                  html: `
                    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                      <div style="background:#1a2744;padding:28px;text-align:center;">
                        <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Store</h1>
                        <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Purchase Complete!</p>
                      </div>
                      <div style="padding:28px;background:white;">
                        <p style="font-size:15px;color:#1a2744;">Hey ${customerName},</p>
                        <p style="color:#666;line-height:1.6;">Your purchase is confirmed and ready to access.</p>
                        <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:20px 0;">
                          <p style="margin:0;font-weight:bold;color:#1a2744;">${productName}</p>
                          <p style="margin:4px 0 0;color:#666;font-size:14px;">Amount: $${amountPaid}</p>
                        </div>
                        <h3 style="color:#1a2744;">How to access:</h3>
                        <ol style="color:#666;line-height:1.8;">
                          <li>Log in at <a href="https://neurochiro.co/login" style="color:#e97325;font-weight:bold;">neurochiro.co</a></li>
                          <li>Go to <a href="https://neurochiro.co/account/purchases" style="color:#e97325;font-weight:bold;">My Purchases</a></li>
                          <li>Click the access button next to your purchase</li>
                        </ol>
                        <div style="text-align:center;margin:24px 0;">
                          <a href="https://neurochiro.co/account/purchases" style="display:inline-block;background:#e97325;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">Access My Purchase</a>
                        </div>
                        <p style="color:#999;font-size:13px;">Questions? Reply to this email.</p>
                      </div>
                      <div style="background:#f0f0f0;padding:14px;text-align:center;font-size:12px;color:#999;">
                        NeuroChiro Network &middot; neurochiro.co
                      </div>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.error('[WEBHOOK] Store confirmation email failed:', emailErr);
              }
            }

            // Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `🛒 **NEW STORE PURCHASE**\n\n**Product:** ${productName}\n**Amount:** $${amountPaid}\n**Email:** ${customerEmail}\n**Name:** ${customerName}`,
                }),
              }).catch(() => {});
            }
          }

          if (metaType === 'store_cart') {
            const productIds = (session.metadata?.productIds || '').split(',').filter(Boolean);
            for (const pid of productIds) {
              await (supabase as any).from('course_purchases').upsert({
                user_id: userId,
                course_id: pid,
                stripe_session_id: session.id,
                amount: session.amount_total,
              }, { onConflict: 'user_id,course_id' });
            }
          }

          if (metaType === 'weekend_intensive') {
            const tier = session.metadata?.tier || 'intensive';
            const attendeeName = session.metadata?.attendeeName || 'Unknown';
            const attendeeEmail = session.metadata?.attendeeEmail || session.customer_details?.email || '';
            const isAccelerator = tier === 'vip';

            // Record the purchase
            if (userId) {
              await (supabase as any).from('course_purchases').insert({
                user_id: userId,
                course_id: `weekend-${tier}`,
                stripe_session_id: session.id,
                amount: session.amount_total,
              });

              // Auto-grant Screening Mastery Kit for Accelerator buyers
              if (isAccelerator) {
                await (supabase as any).from('course_purchases').upsert({
                  user_id: userId,
                  course_id: 'screening-mastery',
                  stripe_session_id: session.id,
                  amount: 0,
                }, { onConflict: 'user_id,course_id' });
              }
            }

            // Send confirmation email
            try {
              const resend = new Resend(process.env.RESEND_API_KEY || '');
              const tierLabel = isAccelerator ? 'The Screening Accelerator' : 'The Screening Intensive';
              await resend.emails.send({
                from: 'NeuroChiro <support@neurochirodirectory.com>',
                to: [attendeeEmail],
                subject: `You're in! Screening Mastery Weekend — ${tierLabel}`,
                html: `
                  <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:#1a2744;padding:32px;text-align:center;">
                      <h1 style="color:white;font-size:24px;margin:0;">Screening Mastery</h1>
                      <p style="color:#e97325;font-size:18px;font-weight:bold;margin:8px 0 0;">You're Registered!</p>
                    </div>
                    <div style="padding:32px;background:white;">
                      <p style="font-size:16px;color:#1a2744;">Hey ${attendeeName},</p>
                      <p style="color:#666;line-height:1.6;">You're officially registered for the <strong>${tierLabel}</strong> — May 22-24, 2026.</p>

                      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:24px 0;">
                        <h3 style="color:#1a2744;margin:0 0 12px;">Your Weekend Schedule:</h3>
                        <p style="margin:4px 0;color:#666;"><strong>Friday, May 22:</strong> 6:00 - 8:30 PM EST</p>
                        <p style="margin:4px 0;color:#666;"><strong>Saturday, May 23:</strong> 9:00 AM - 3:00 PM EST</p>
                        <p style="margin:4px 0;color:#666;"><strong>Sunday, May 24:</strong> 9:00 AM - 12:30 PM EST</p>
                      </div>

                      <h3 style="color:#1a2744;">What's Next:</h3>
                      <ol style="color:#666;line-height:1.8;">
                        <li><strong>Zoom link</strong> will be sent 48 hours before the event</li>
                        <li>Visit your <a href="https://neurochiro.co/screening-weekend/welcome" style="color:#e97325;font-weight:bold;">Welcome Page</a> for prep materials</li>
                        ${isAccelerator ? '<li>Your <strong>Screening Command Center</strong> will be activated during the weekend</li>' : ''}
                        ${isAccelerator ? '<li>Your <strong>Screening Mastery Kit</strong> has been added to your doctor portal</li>' : ''}
                        <li>Come ready to practice — breakout rooms start Saturday morning</li>
                      </ol>

                      <div style="text-align:center;margin:32px 0;">
                        <a href="https://neurochiro.co/screening-weekend/welcome" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">View Your Welcome Page</a>
                      </div>

                      <p style="color:#999;font-size:13px;">Questions? Reply to this email or text Dr. Ray directly.</p>
                    </div>
                    <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999;">
                      NeuroChiro Network &middot; Screening Mastery Weekend &middot; May 22-24, 2026
                    </div>
                  </div>
                `,
              });
            } catch (emailErr) {
              console.error('[WEBHOOK] Confirmation email failed:', emailErr);
            }

            // Send Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              const tierLabel = isAccelerator ? 'Screening Accelerator ($1,750)' : 'Screening Intensive ($750)';
              const isPlan = session.mode === 'subscription';
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `🎯 **NEW SCREENING WEEKEND REGISTRATION**\n\n**Name:** ${attendeeName}\n**Email:** ${attendeeEmail}\n**Tier:** ${tierLabel}${isPlan ? ' (Payment Plan)' : ' (Paid in Full)'}\n**Amount:** $${((session.amount_total || 0) / 100).toFixed(2)}\n**Date:** ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`,
                }),
              }).catch(() => {});
            }
          }

          if (metaType === 'course_bundle') {
            const courseIds = (session.metadata?.courseIds || '').split(',').filter(Boolean);
            for (const courseId of courseIds) {
              await (supabase as any).from('course_purchases').upsert({
                user_id: userId,
                course_id: courseId,
                stripe_session_id: session.id,
                amount: session.amount_total,
              }, { onConflict: 'user_id,course_id' });
            }
          }

          if (metaType === 'job_listing') {
            const durationDays = parseInt(session.metadata?.duration || '30', 10);
            const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
            await supabase.from('job_postings').insert({
              doctor_id: userId,
              title: session.metadata?.title || 'Untitled Position',
              description: session.metadata?.description || '',
              category: session.metadata?.category || null,
              employment_type: session.metadata?.employment_type || null,
              salary_min: parseInt(session.metadata?.salary_min || '0', 10) || null,
              salary_max: parseInt(session.metadata?.salary_max || '0', 10) || null,
              city: session.metadata?.city || null,
              state: session.metadata?.state || null,
              apply_method: session.metadata?.apply_method || 'neurochiro',
              apply_url: session.metadata?.apply_url || null,
              expires_at: expiresAt,
              status: 'Active',
            });

            // Confirmation email
            const contactEmail = session.metadata?.contact_email || session.customer_details?.email;
            if (contactEmail) {
              try {
                const resend = new Resend(process.env.RESEND_API_KEY || '');
                await resend.emails.send({
                  from: 'NeuroChiro <support@neurochirodirectory.com>',
                  to: [contactEmail],
                  subject: 'Your job listing is live on NeuroChiro!',
                  html: `
                    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                      <div style="background:#1a2744;padding:28px;text-align:center;">
                        <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Careers</h1>
                        <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Job Listing Published!</p>
                      </div>
                      <div style="padding:28px;background:white;">
                        <p style="color:#333;font-size:15px;">Your job listing is now live and visible to candidates.</p>
                        <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:20px 0;">
                          <p style="margin:0;font-weight:bold;color:#1a2744;">${session.metadata?.title || 'Your Position'}</p>
                          <p style="margin:4px 0 0;color:#666;font-size:14px;">Duration: ${durationDays} days &middot; Expires: ${new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                        </div>
                        <div style="text-align:center;margin:24px 0;">
                          <a href="https://neurochiro.co/careers" style="display:inline-block;background:#e97325;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">View Your Listing</a>
                        </div>
                        <p style="color:#999;font-size:13px;">You'll receive email notifications when candidates apply.</p>
                      </div>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.error('[WEBHOOK] Job listing email failed:', emailErr);
              }
            }

            // Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `💼 **NEW PAID JOB LISTING**\n\n**Title:** ${session.metadata?.title || 'Untitled'}\n**Duration:** ${durationDays} days\n**Location:** ${session.metadata?.city || 'N/A'}, ${session.metadata?.state || ''}\n**Amount:** $${((session.amount_total || 0) / 100).toFixed(2)}`,
                }),
              }).catch(() => {});
            }
          }
        }

        // Handle guest store purchases (no userId)
        if (!userId) {
          const metaType = session.metadata?.type;
          const customerEmail = session.customer_details?.email || session.customer_email;

          if (metaType === 'store_purchase') {
            const productId = session.metadata?.productId;
            if (productId) {
              // Try to find a user by email to link the purchase
              let guestUserId: string | null = null;
              if (customerEmail) {
                const { data: existingUser } = await supabase
                  .from('profiles')
                  .select('id')
                  .eq('email', customerEmail)
                  .maybeSingle();
                if (existingUser) guestUserId = existingUser.id;
              }
              if (guestUserId) {
                await (supabase as any).from('course_purchases').insert({
                  user_id: guestUserId,
                  course_id: productId,
                  stripe_session_id: session.id,
                  amount: session.amount_total,
                });
              }
              // If no user found, the purchase will be linked later when they register
              // via the /account/purchases page which matches by Stripe email
            }
          }

          if (metaType === 'weekend_intensive') {
            const tier = session.metadata?.tier || 'intensive';
            const attendeeName = session.metadata?.attendeeName || 'Unknown';
            const attendeeEmail = session.metadata?.attendeeEmail || customerEmail || '';
            const isAccelerator = tier === 'vip';

            // Try to link to existing user
            let guestUserId: string | null = null;
            if (customerEmail) {
              const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', customerEmail)
                .maybeSingle();
              if (existingUser) guestUserId = existingUser.id;
            }
            if (guestUserId) {
              await (supabase as any).from('course_purchases').insert({
                user_id: guestUserId,
                course_id: `weekend-${tier}`,
                stripe_session_id: session.id,
                amount: session.amount_total,
              });
              if (isAccelerator) {
                await (supabase as any).from('course_purchases').upsert({
                  user_id: guestUserId,
                  course_id: 'screening-mastery',
                  stripe_session_id: session.id,
                  amount: 0,
                }, { onConflict: 'user_id,course_id' });
              }
            }

            // Confirmation email (same as authenticated path)
            try {
              const resend = new Resend(process.env.RESEND_API_KEY || '');
              const tierLabel = isAccelerator ? 'The Screening Accelerator' : 'The Screening Intensive';
              await resend.emails.send({
                from: 'NeuroChiro <support@neurochirodirectory.com>',
                to: [attendeeEmail],
                subject: `You're in! Screening Mastery Weekend — ${tierLabel}`,
                html: `
                  <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                    <div style="background:#1a2744;padding:32px;text-align:center;">
                      <h1 style="color:white;font-size:24px;margin:0;">Screening Mastery</h1>
                      <p style="color:#e97325;font-size:18px;font-weight:bold;margin:8px 0 0;">You're Registered!</p>
                    </div>
                    <div style="padding:32px;background:white;">
                      <p style="font-size:16px;color:#1a2744;">Hey ${attendeeName},</p>
                      <p style="color:#666;line-height:1.6;">You're officially registered for the <strong>${tierLabel}</strong> — May 22-24, 2026.</p>
                      <div style="background:#f8f9fa;border-radius:12px;padding:20px;margin:24px 0;">
                        <h3 style="color:#1a2744;margin:0 0 12px;">Your Weekend Schedule:</h3>
                        <p style="margin:4px 0;color:#666;"><strong>Friday, May 22:</strong> 6:00 - 8:30 PM EST</p>
                        <p style="margin:4px 0;color:#666;"><strong>Saturday, May 23:</strong> 9:00 AM - 3:00 PM EST</p>
                        <p style="margin:4px 0;color:#666;"><strong>Sunday, May 24:</strong> 9:00 AM - 12:30 PM EST</p>
                      </div>
                      <h3 style="color:#1a2744;">What's Next:</h3>
                      <ol style="color:#666;line-height:1.8;">
                        <li><strong>Create your free Doctor account</strong> at <a href="https://neurochiro.co/register?role=doctor" style="color:#e97325;">neurochiro.co/register</a> (use this same email — select "Doctor" when registering)</li>
                        <li><strong>Zoom link</strong> will be sent 48 hours before</li>
                        <li>Visit your <a href="https://neurochiro.co/screening-weekend/welcome" style="color:#e97325;font-weight:bold;">Welcome Page</a> for prep materials</li>
                      </ol>
                      <div style="text-align:center;margin:32px 0;">
                        <a href="https://neurochiro.co/screening-weekend/welcome" style="display:inline-block;background:#e97325;color:white;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:bold;font-size:16px;">View Your Welcome Page</a>
                      </div>
                    </div>
                    <div style="background:#f0f0f0;padding:16px;text-align:center;font-size:12px;color:#999;">
                      NeuroChiro Network &middot; Screening Mastery Weekend &middot; May 22-24, 2026
                    </div>
                  </div>
                `,
              });
            } catch (emailErr) {
              console.error('[WEBHOOK] Guest confirmation email failed:', emailErr);
            }

            // Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              const tierLabel = isAccelerator ? 'Screening Accelerator ($1,750)' : 'Screening Intensive ($750)';
              const isPlan = session.mode === 'subscription';
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `🎯 **NEW SCREENING WEEKEND REGISTRATION**\n\n**Name:** ${attendeeName}\n**Email:** ${attendeeEmail}\n**Tier:** ${tierLabel}${isPlan ? ' (Payment Plan)' : ' (Paid in Full)'}\n**Amount:** $${((session.amount_total || 0) / 100).toFixed(2)}`,
                }),
              }).catch(() => {});
            }
          }

          if (metaType === 'store_cart') {
            const productIds = (session.metadata?.productIds || '').split(',').filter(Boolean);
            let guestUserId: string | null = null;
            if (customerEmail) {
              const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', customerEmail)
                .maybeSingle();
              if (existingUser) guestUserId = existingUser.id;
            }
            if (guestUserId) {
              for (const pid of productIds) {
                await (supabase as any).from('course_purchases').upsert({
                  user_id: guestUserId,
                  course_id: pid,
                  stripe_session_id: session.id,
                  amount: session.amount_total,
                }, { onConflict: 'user_id,course_id' });
              }
            }
          }

          if (metaType === 'job_listing') {
            // Guest paid job listing — try to find the doctor by email
            let guestDoctorId: string | null = null;
            if (customerEmail) {
              const { data: existingUser } = await supabase
                .from('profiles')
                .select('id')
                .eq('email', customerEmail)
                .maybeSingle();
              if (existingUser) guestDoctorId = existingUser.id;
            }

            const durationDays = parseInt(session.metadata?.duration || '30', 10);
            const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();
            await (supabase as any).from('job_postings').insert({
              doctor_id: guestDoctorId,
              title: session.metadata?.title || 'Untitled Position',
              description: session.metadata?.description || '',
              category: session.metadata?.category || null,
              employment_type: session.metadata?.employment_type || null,
              salary_min: parseInt(session.metadata?.salary_min || '0', 10) || null,
              salary_max: parseInt(session.metadata?.salary_max || '0', 10) || null,
              city: session.metadata?.city || null,
              state: session.metadata?.state || null,
              apply_method: session.metadata?.apply_method || 'neurochiro',
              apply_url: session.metadata?.apply_url || null,
              expires_at: expiresAt,
              status: 'Active',
            });

            // Confirmation email
            const contactEmail = session.metadata?.contact_email || customerEmail;
            if (contactEmail) {
              try {
                const resend = new Resend(process.env.RESEND_API_KEY || '');
                await resend.emails.send({
                  from: 'NeuroChiro <support@neurochirodirectory.com>',
                  to: [contactEmail],
                  subject: 'Your job listing is live on NeuroChiro!',
                  html: `
                    <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
                      <div style="background:#1a2744;padding:28px;text-align:center;">
                        <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Careers</h1>
                        <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Job Listing Published!</p>
                      </div>
                      <div style="padding:28px;background:white;">
                        <p style="color:#333;font-size:15px;">Your job listing is now live and visible to candidates.</p>
                        <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:20px 0;">
                          <p style="margin:0;font-weight:bold;color:#1a2744;">${session.metadata?.title || 'Your Position'}</p>
                          <p style="margin:4px 0 0;color:#666;font-size:14px;">Duration: ${durationDays} days</p>
                        </div>
                        <div style="text-align:center;margin:24px 0;">
                          <a href="https://neurochiro.co/careers" style="display:inline-block;background:#e97325;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">View Your Listing</a>
                        </div>
                      </div>
                    </div>
                  `,
                });
              } catch (emailErr) {
                console.error('[WEBHOOK] Guest job listing email failed:', emailErr);
              }
            }

            // Discord notification
            const discordUrl = process.env.DISCORD_WEBHOOK_URL;
            if (discordUrl) {
              await fetch(discordUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  content: `💼 **NEW PAID JOB LISTING (Guest)**\n\n**Title:** ${session.metadata?.title || 'Untitled'}\n**Duration:** ${durationDays} days\n**Location:** ${session.metadata?.city || 'N/A'}, ${session.metadata?.state || ''}\n**Email:** ${customerEmail || 'Unknown'}\n**Amount:** $${((session.amount_total || 0) / 100).toFixed(2)}`,
                }),
              }).catch(() => {});
            }
          }
        }

        // Enqueue automations
        Automations.onPaymentSuccess(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        const customer = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'active', tier: 'active' })
            .eq('id', profile.id);
        }

        // Auto-cancel payment plan subscriptions after 3 payments
        const subscriptionId = invoice.subscription;
        if (subscriptionId) {
          try {
            const sub = await stripe.subscriptions.retrieve(subscriptionId as string);
            const paymentPlan = sub.metadata?.paymentPlan;
            if (paymentPlan === '3-month') {
              // Count invoices paid for this subscription
              const invoices = await stripe.invoices.list({
                subscription: subscriptionId as string,
                status: 'paid',
                limit: 10,
              });
              if (invoices.data.length >= 3) {
                // All 3 payments received — cancel the subscription
                await stripe.subscriptions.cancel(subscriptionId as string);
                console.log(`[WEBHOOK] Auto-canceled 3-payment plan subscription: ${subscriptionId}`);
              }
            }
          } catch (cancelErr) {
            console.error('[WEBHOOK] Error checking/canceling payment plan:', cancelErr);
          }
        }

        Automations.onPaymentSuccess(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const customer = invoice.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'past_due', tier: 'free' })
            .eq('id', profile.id);
        }

        Automations.onPaymentFailed(invoice);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as any;
        const customer = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: subscription.status })
            .eq('id', profile.id);
        }

        Automations.onSubscriptionUpdated(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as any;
        const customer = subscription.customer as string;

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'canceled', tier: 'free' })
            .eq('id', profile.id);
        }

        Automations.onSubscriptionCanceled(subscription);
        break;
      }
    }
  } catch (error) {
    console.error("Webhook Automation Dispatch Error:", error);
  }

  return NextResponse.json({ received: true });
}
