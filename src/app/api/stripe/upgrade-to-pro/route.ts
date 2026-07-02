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
    const priceId = cycle === "annual" ? PLANS.doctor.annual.priceId : PLANS.doctor.monthly.priceId;

    if (!priceId) {
      return NextResponse.json({ error: "Price not configured" }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${siteUrl}/doctor/dashboard?upgraded=true`,
      cancel_url: `${siteUrl}/doctor/billing?canceled=true`,
      metadata: {
        userId,
        planId: priceId,
        tier: "pro",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("[UPGRADE TO PRO ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
