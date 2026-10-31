'use server'
import { stripe, PLANS } from '@/lib/stripe'
import { createServerSupabase } from '@/lib/supabase-server'

export async function createMemberSeminar(seminarData: {
  title: string; description: string; location: string; dates: string; registrationLink: string; price: string; capacity: string; hostEmail: string;
}) {
  try {
    const supabase = createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: "Please log in to create a seminar." }

    // Validate registration_link
    if (seminarData.registrationLink && !seminarData.registrationLink.startsWith('https://')) {
      return { error: "Registration link must use HTTPS." }
    }

    const { insertFlexible } = await import('@/lib/seminars/write')
    const inserted = await insertFlexible('seminars', {
      title: seminarData.title,
      description: seminarData.description,
      location: seminarData.location,
      city: seminarData.location,
      dates: seminarData.dates,
      registration_link: seminarData.registrationLink,
      price: parseFloat(seminarData.price.replace(/[^0-9.]/g, '')) || 0,
      capacity: Number(seminarData.capacity) || null,
      host_id: user.id,
      payment_status: 'pending',
      is_approved: false,
      status: 'submitted',
      host_type_at_submission: 'member',
      registration_mode: 'external',
    })
    const error = inserted.error

    if (error) {
      console.error("Seminar creation error:", error)
      return { error: "Failed to create seminar. Please try again." }
    }

    // Confirmation email
    try {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY || '');
      await resend.emails.send({
        from: process.env.RESEND_FROM_SEMINARS || 'NeuroChiro Seminars <seminars@neurochiro.co>',
        to: [seminarData.hostEmail],
        subject: `Seminar submitted: "${seminarData.title}" — under review`,
        html: `
          <div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;">
            <div style="background:#1a2744;padding:28px;text-align:center;">
              <h1 style="color:white;font-size:22px;margin:0;">NeuroChiro Seminars</h1>
              <p style="color:#e97325;font-size:16px;font-weight:bold;margin:8px 0 0;">Submitted for review</p>
            </div>
            <div style="padding:28px;background:white;">
              <p style="color:#333;font-size:15px;">Your seminar was submitted for review. It is not live yet.</p>
              <div style="background:#f8f9fa;border-radius:10px;padding:16px;margin:20px 0;">
                <p style="margin:0;font-weight:bold;color:#1a2744;">${seminarData.title}</p>
                <p style="margin:4px 0 0;color:#666;font-size:14px;">${seminarData.location} &middot; ${seminarData.dates}</p>
              </div>
              <div style="text-align:center;margin:24px 0;">
                <a href="https://neurochiro.co/seminars" style="display:inline-block;background:#e97325;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:bold;">View Seminars</a>
              </div>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Member seminar email failed:', emailErr);
    }

    // Discord notification
    try {
      const discordUrl = process.env.DISCORD_WEBHOOK_URL;
      if (discordUrl) {
        await fetch(discordUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: `📢 **SEMINAR SUBMITTED**\n\n**Title:** ${seminarData.title}\n**Location:** ${seminarData.location}\n**Date:** ${seminarData.dates}\n**Host:** ${seminarData.hostEmail}\n**Status:** Submitted for review`,
          }),
        }).catch(() => {});
      }
    } catch {}

    return { success: true }
  } catch (err) {
    console.error("Seminar creation exception:", err)
    return { error: "Something went wrong. Please try again." }
  }
}

export async function createSeminarListingCheckout(seminarData: {
  title: string; description: string; location: string; dates: string; registrationLink: string; price: string; capacity: string; hostEmail: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co';
  const priceId = PLANS.seminar_listing.oneTime.priceId;
  if (!priceId) return { error: "Seminar listing pricing not configured." };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: seminarData.hostEmail,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${siteUrl}/seminars?listed=true`,
    cancel_url: `${siteUrl}/seminars/host?canceled=true`,
    metadata: {
      type: 'seminar_listing',
      title: seminarData.title,
      description: seminarData.description.slice(0, 500),
      location: seminarData.location,
      dates: seminarData.dates,
      registrationLink: seminarData.registrationLink,
      price: seminarData.price,
      capacity: seminarData.capacity,
      hostEmail: seminarData.hostEmail,
    },
  });

  return { url: session.url };
}
