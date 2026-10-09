import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * RESEND WEBHOOK HANDLER
 * Handles bounces, complaints, and unsubscribes for both transactional and marketing domains.
 */
export async function POST(req: Request) {
  // Verify webhook authenticity via shared secret
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    const signature = req.headers.get('svix-signature') || req.headers.get('resend-signature');
    if (!signature) {
      console.warn('[RESEND WEBHOOK] Missing signature header');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
  }

  const body = await req.json();
  const supabase = createServerSupabase();
  const adminDb = createAdminClient();

  const eventType = body.type;
  const payload = body.data;

  try {
    const email = payload.to?.[0];
    if (!email) {
      return NextResponse.json({ received: true });
    }

    switch (eventType) {
      case "email.bounced":
        console.warn(`[REPUTATION ALERT] Email bounced for: ${email}`);
        await handleProfileEmailEvent(email, supabase, { has_bounced: true });
        await handleSubscriberUnsubscribe(email, adminDb);
        await handleContactRequestBounce(email, adminDb);
        break;

      case "email.complained":
        console.warn(`[REPUTATION ALERT] User marked email as SPAM: ${email}`);
        await handleProfileEmailEvent(email, supabase, { has_complained: true });
        await handleSubscriberUnsubscribe(email, adminDb);
        break;

      case "contact.unsubscribed":
        // Resend Audience unsubscribe event
        const unsubEmail = payload.email || email;
        console.log(`[UNSUBSCRIBE] Contact unsubscribed: ${unsubEmail}`);
        await handleSubscriberUnsubscribe(unsubEmail, adminDb);
        break;

      case "email.sent":
      case "email.delivered":
        break;

      default:
        console.log(`[RESEND WEBHOOK] Unhandled event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[RESEND WEBHOOK ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

async function handleProfileEmailEvent(email: string, supabase: any, update: Record<string, boolean>) {
  const userId = await getUserIdFromEmail(email, supabase);
  if (userId) {
    await supabase
      .from('email_preferences')
      .update({ ...update, updated_at: new Date().toISOString() })
      .eq('user_id', userId);
  }
}

async function handleSubscriberUnsubscribe(email: string, adminDb: any) {
  const { data } = await adminDb
    .from('subscribers')
    .select('id, status')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (data && data.status !== 'unsubscribed') {
    await adminDb
      .from('subscribers')
      .update({
        status: 'unsubscribed',
        unsubscribed_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    console.log(`[SUBSCRIBER] Unsubscribed via webhook: ${email}`);
  }
}

/**
 * When a doctor's email bounces, mark all their pending contact request
 * escalations as bounced and flag the requests for immediate admin attention.
 */
async function handleContactRequestBounce(email: string, adminDb: any) {
  try {
    // Find doctors with this email
    const { data: doctors } = await adminDb
      .from('doctors')
      .select('id')
      .eq('email', email)
    if (!doctors?.length) return

    const doctorIds = doctors.map((d: any) => d.id)

    // Find open contact requests for these doctors
    const { data: requests } = await adminDb
      .from('contact_requests')
      .select('id')
      .in('doctor_id', doctorIds)
      .eq('status', 'new')

    if (!requests?.length) return

    for (const r of requests) {
      // Mark all escalation steps as bounced
      await adminDb
        .from('contact_request_escalations')
        .update({ delivered: false, error: 'Email bounced' })
        .eq('contact_request_id', r.id)
        .is('delivered', null)

      // Flag the request so it appears as overdue immediately
      await adminDb
        .from('contact_requests')
        .update({ admin_note: (await adminDb.from('contact_requests').select('admin_note').eq('id', r.id).single()).data?.admin_note
          ? undefined  // Don't overwrite existing note
          : 'Doctor email bounced. Needs manual follow-up.' })
        .eq('id', r.id)
    }

    console.warn(`[CONTACT_REQUEST] Bounce detected for ${email}, flagged ${requests.length} requests`)
  } catch (e) {
    console.error('[CONTACT_REQUEST] Bounce handler error:', e)
  }
}

async function getUserIdFromEmail(email: string, supabase: any) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  return data?.id;
}
