import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

/**
 * RESEND WEBHOOK HANDLER
 * Protects your sender reputation by catching bounces and complaints.
 */
export async function POST(req: Request) {
  const body = await req.json();
  const supabase = createServerSupabase();

  // 1. Identify Event Type
  const eventType = body.type; // 'email.bounced', 'email.complained', 'email.clicked', etc.
  const payload = body.data;

  console.log(`[RESEND WEBHOOK] Received event: ${eventType}`, payload);

  try {
    // 2. Extract User ID and Event Data
    // Resend sends tags in the email metadata if we provided them.
    // Otherwise, we look up by email address.
    const email = payload.to[0];

    switch (eventType) {
      case "email.bounced":
        console.warn(`[REPUTATION ALERT] Email bounced for: ${email}`);
        await (supabase as any)
          .from('email_preferences')
          .update({ has_bounced: true, updated_at: new Date().toISOString() })
          .eq('user_id', (await getUserIdFromEmail(email, supabase)));
        break;

      case "email.complained":
        console.warn(`[REPUTATION ALERT] User marked email as SPAM: ${email}`);
        await (supabase as any)
          .from('email_preferences')
          .update({ has_complained: true, updated_at: new Date().toISOString() })
          .eq('user_id', (await getUserIdFromEmail(email, supabase)));
        break;

      case "email.sent":
      case "email.delivered":
        // Optional: Log delivery success in a 'email_logs' table if created
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

async function getUserIdFromEmail(email: string, supabase: any) {
  const { data } = await (supabase as any)
    .from('profiles')
    .select('id')
    .eq('email', email)
    .single();
  return data?.id;
}
