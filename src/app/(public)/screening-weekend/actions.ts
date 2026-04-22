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
    intensive: { price: 75000, label: "The Screening Intensive" },
    vip: { price: 175000, label: "The Screening Accelerator + Command Center" },
  };

  const planPrices = {
    intensive: 30000, // $300 x 3 = $900
    vip: 63400, // $634 x 3 = $1,902 (~$150 more than PIF)
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
            paymentPlan: "3-month",
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
