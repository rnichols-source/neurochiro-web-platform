"use server";

import { stripe } from "@/lib/stripe";

export async function createWeekendCheckout(
  tier: "intensive" | "vip",
  name: string,
  email: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

  const tiers = {
    intensive: { price: 199700, label: "Screening Mastery Weekend Intensive" },
    vip: { price: 499700, label: "Screening Mastery Weekend — VIP + 90-Day Coaching" },
  };

  const selected = tiers[tier];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: selected.label },
            unit_amount: selected.price,
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "weekend_intensive",
        tier,
        attendeeName: name,
        attendeeEmail: email,
      },
      customer_creation: "always",
      customer_email: email,
      success_url: `${baseUrl}/screening-weekend?registered=true&tier=${tier}`,
      cancel_url: `${baseUrl}/screening-weekend`,
    });

    return { url: session.url };
  } catch (err: any) {
    return { error: err.message || "Something went wrong" };
  }
}
