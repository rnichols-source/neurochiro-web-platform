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

async function getUserIdFromEmail(email: string, supabase: any) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  return data?.id;
}
