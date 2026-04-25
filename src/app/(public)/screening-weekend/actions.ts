"use server";

import { stripe } from "@/lib/stripe";

export async function createWeekendCheckout(
  tier: "intensive" | "intensive-plan" | "vip" | "vip-plan",
  name: string,
  email: string,
  isStudent: boolean = false,
) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

  // Pay-in-full vs payment plan
  const isPaymentPlan = tier.endsWith("-plan");
  const baseTier = tier.replace("-plan", "") as "intensive" | "vip";

  // Doctor pricing
  const docTiers = {
    intensive: { price: 49700, label: "The Screening Intensive" },
    vip: { price: 99700, label: "The Screening Accelerator + Command Center" },
  };
  const docPlanPrices = {
    intensive: 24900, // $249 x 2 = $498
    vip: 49900, // $499 x 2 = $998
  };

  // Student pricing (50% off)
  const studentTiers = {
    intensive: { price: 24700, label: "The Screening Intensive (Student)" },
    vip: { price: 49700, label: "The Screening Accelerator + Command Center (Student)" },
  };
  const studentPlanPrices = {
    intensive: 12400, // $124 x 2 = $248
    vip: 24900, // $249 x 2 = $498
  };

  const tiers = isStudent ? studentTiers : docTiers;
  const planPrices = isStudent ? studentPlanPrices : docPlanPrices;
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
            isStudent: isStudent ? "true" : "false",
            attendeeName: name,
          },
        },
        metadata: {
          type: "weekend_intensive",
          tier: baseTier,
          isStudent: isStudent ? "true" : "false",
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
          isStudent: isStudent ? "true" : "false",
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
