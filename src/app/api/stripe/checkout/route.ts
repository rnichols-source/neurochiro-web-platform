import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase-server";
import { z } from "zod";

const checkoutSchema = z.object({
  billing: z.enum(["monthly", "annual"]).default("monthly"),
  tier: z.string().default("pro"),
});

const PLANS: Record<string, { monthly: number; annual: number; name: string }> = {
  pro: { monthly: 9900, annual: 99000, name: "NeuroChiro Pro" },
};

export async function POST(req: Request) {
  try {
    // Authenticate the user
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const result = checkoutSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { billing, tier } = result.data;
    const plan = PLANS[tier];
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const userId = user.id;
    const isAnnual = billing === "annual";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      subscription_data: {
        metadata: { userId, tier },
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: plan.name },
            unit_amount: isAnnual ? plan.annual : plan.monthly,
            recurring: { interval: isAnnual ? "year" : "month" },
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/doctor/dashboard?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://neurochiro.co'}/doctor/billing?canceled=true`,
      metadata: {
        userId,
        tier,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
