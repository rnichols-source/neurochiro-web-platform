"use server";

import { stripe } from "@/lib/stripe";

export async function createWeekendCheckout(
  tier: "intensive" | "intensive-plan" | "vip" | "vip-plan",
  name: string,
  email: string,
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

  // Pay-in-full vs payment plan
  const isPaymentPlan = tier.endsWith("-plan");
  const baseTier = tier.replace("-plan", "") as "intensive" | "vip";

  const tiers = {
    intensive: { price: 199700, label: "Screening Mastery Weekend Intensive" },
    vip: { price: 499700, label: "Screening Mastery Weekend — VIP + 90-Day Coaching" },
  };

  const planPrices = {
    intensive: 109900, // $1,099 x 2
    vip: 259900, // $2,599 x 2
  };

  const selected = tiers[baseTier];

  try {
    if (isPaymentPlan) {
      // Subscription mode — 3 monthly payments
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: { name: `${selected.label} (3-Payment Plan)` },
              unit_amount: planPrices[baseTier],
              recurring: { interval: "month" as const, interval_count: 1 },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            type: "weekend_intensive",
            tier: baseTier,
            paymentPlan: "2-month",
            attendeeName: name,
          },
        },
        metadata: {
          type: "weekend_intensive",
          tier: baseTier,
          attendeeName: name,
          attendeeEmail: email,
        },
        customer_email: email,
        success_url: `${baseUrl}/screening-weekend?registered=true&tier=${baseTier}`,
        cancel_url: `${baseUrl}/screening-weekend`,
      });
      return { url: session.url };
    } else {
      // One-time payment
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
          tier: baseTier,
          attendeeName: name,
          attendeeEmail: email,
        },
        customer_creation: "always",
        customer_email: email,
        success_url: `${baseUrl}/screening-weekend?registered=true&tier=${baseTier}`,
        cancel_url: `${baseUrl}/screening-weekend`,
      });
      return { url: session.url };
    }
  } catch (err: any) {
    return { error: err.message || "Something went wrong" };
  }
}
