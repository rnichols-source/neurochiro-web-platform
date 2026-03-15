import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { Automations } from "@/lib/automations";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature") as string;
  const supabase = createServerSupabase();

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || "whsec_mock"
    );
  } catch (error: unknown) {
    const err = error as Error;
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // 1. IDEMPOTENCY CHECK
  // Check if we've already processed this event ID to prevent duplicate actions
  const { data: alreadyProcessed } = await supabase
    .from('processed_webhooks')
    .select('id')
    .eq('id', event.id)
    .single();

  if (alreadyProcessed) {
    console.log(`[STRIPE] Skipping already processed event: ${event.id}`);
    return NextResponse.json({ received: true, duplicate: true });
  }

  // 2. RECORD PROCESSING START
  await (supabase as any).from('processed_webhooks').insert({ id: event.id });

  try {
    // 3. TRIGGER BACKGROUND AUTOMATIONS
    // We do NOT 'await' these calls. Automations.enqueue handles DB persistence
    // and background execution, returning control to this route immediately.
    switch (event.type) {
      case "checkout.session.completed":
        Automations.onPaymentSuccess(event.data.object);
        break;
      case "invoice.payment_succeeded":
        // Handle successful renewals
        Automations.onPaymentSuccess(event.data.object);
        break;
      case "invoice.payment_failed":
        Automations.onPaymentFailed(event.data.object);
        break;
      case "customer.subscription.updated":
        // Handle tier upgrades/downgrades
        Automations.onSubscriptionUpdated(event.data.object);
        break;
      case "customer.subscription.deleted":
        Automations.onSubscriptionCanceled(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    // We log the error but still return 200 to Stripe. 
    // The event is recorded in processed_webhooks, and individual 
    // automation failures are tracked in the automation_queue table.
    console.error("Webhook Automation Dispatch Error:", error);
  }

  return NextResponse.json({ received: true });
}
