import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { stripeCheckoutSchema } from "@/lib/validations";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // 1. Validate Input (Security Check)
    const result = stripeCheckoutSchema.safeParse(body);
    if (!result.success) {
      console.warn(`[SECURITY AUDIT] Invalid checkout attempt: ${result.error.message}`);
      return NextResponse.json({ error: "Invalid Request Payload", details: result.error.format() }, { status: 400 });
    }

    const { priceId, tier } = result.data;
    // Always use the authenticated user's ID — never trust client-provided userId
    const userId = user.id;

    // 2. Create Session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/doctor/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/doctor/billing?canceled=true`,
      metadata: {
        userId,
        planId: priceId,
        tier: tier || '',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
