import { NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { cycle = "monthly" } = body as { cycle?: "monthly" | "annual" };
    const userId = user.id;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

    if (cycle === "annual") {
      // Annual: single $2,997 payment (setup fee waived)
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        line_items: [
          {
            price: PLANS.neuros.annual.priceId,
            quantity: 1,
          },
        ],
        success_url: `${siteUrl}/doctor/neuros?welcome=true`,
        cancel_url: `${siteUrl}/neuros?canceled=true`,
        metadata: {
          userId,
          type: "neuros_signup",
          tier: "neuros",
          cycle: "annual",
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Monthly: $997 setup fee (one-time) + $297/mo subscription
    // Stripe supports mixed mode with subscription + one-time in subscription mode
    const lineItems: any[] = [
      {
        price: PLANS.neuros.monthly.priceId,
        quantity: 1,
      },
    ];

    // Add setup fee as a one-time price if configured
    if (PLANS.neuros_setup.oneTime.priceId) {
      lineItems.push({
        price: PLANS.neuros_setup.oneTime.priceId,
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,
      success_url: `${siteUrl}/doctor/neuros?welcome=true`,
      cancel_url: `${siteUrl}/neuros?canceled=true`,
      metadata: {
        userId,
        type: "neuros_signup",
        tier: "neuros",
        cycle: "monthly",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[NEUROS CHECKOUT ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
