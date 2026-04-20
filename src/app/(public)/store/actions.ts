"use server";

import { stripe } from "@/lib/stripe";

export async function createStoreCheckout(
  productId: string,
  productName: string,
  priceInCents: number,
  billing: "one_time" | "monthly",
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

    const session = await stripe.checkout.sessions.create({
      mode: billing === "monthly" ? "subscription" : "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: productName },
            unit_amount: priceInCents,
            ...(billing === "monthly" && { recurring: { interval: "month" as const } }),
          },
          quantity: 1,
        },
      ],
      metadata: {
        type: "store_purchase",
        productId,
      },
      ...(billing !== "monthly" && { customer_creation: "always" as const }),
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store`,
    });

    return { url: session.url };
  } catch (err: any) {
    return { error: err.message || "Something went wrong" };
  }
}
