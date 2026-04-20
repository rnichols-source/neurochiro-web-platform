"use server";

import { stripe } from "@/lib/stripe";

interface CartLineItem {
  productId: string;
  name: string;
  retailPrice: number; // cents
  billing: "one_time" | "monthly";
}

export async function createCartCheckout(items: CartLineItem[]) {
  try {
    if (!items.length) {
      return { error: "Cart is empty" };
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

    const oneTimeItems = items.filter((i) => i.billing === "one_time");
    const recurringItems = items.filter((i) => i.billing === "monthly");

    // Stripe doesn't allow mixing payment + subscription modes in a single
    // session. If the cart contains both one-time and recurring items we need
    // to use subscription mode with one-time items added via `price_data`
    // without `recurring`. Stripe supports this when mode = "subscription".
    const hasRecurring = recurringItems.length > 0;
    const mode = hasRecurring ? "subscription" : "payment";

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: item.retailPrice,
        ...(item.billing === "monthly" && {
          recurring: { interval: "month" as const },
        }),
      },
      quantity: 1,
    }));

    const allProductIds = items.map((i) => i.productId).join(",");

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: lineItems,
      metadata: {
        type: "store_cart_purchase",
        productIds: allProductIds,
        source: "public_store_cart",
      },
      customer_creation: mode === "payment" ? "always" : undefined,
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store`,
    });

    return { url: session.url };
  } catch (err: any) {
    return { error: err.message || "Something went wrong" };
  }
}
