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

    // Separate one-time and monthly items
    const oneTimeItems = items.filter((i) => i.billing === "one_time");
    const recurringItems = items.filter((i) => i.billing === "monthly");

    // If there are monthly items, we can't mix with one-time in one session.
    // Process only one-time items per cart checkout. Monthly items use
    // individual Buy Now (which creates a subscription session).
    const checkoutItems = recurringItems.length > 0 && oneTimeItems.length > 0
      ? oneTimeItems // Only checkout one-time items; monthly must be bought individually
      : items;

    const hasRecurring = checkoutItems.some((i) => i.billing === "monthly");
    const mode = hasRecurring ? ("subscription" as const) : ("payment" as const);

    const lineItems = checkoutItems.map((item) => ({
      price_data: {
        currency: "usd" as const,
        product_data: { name: item.name },
        unit_amount: item.retailPrice,
        ...(item.billing === "monthly" && {
          recurring: { interval: "month" as const },
        }),
      },
      quantity: 1,
    }));

    const allProductIds = checkoutItems.map((i) => i.productId).join(",");

    const session = await stripe.checkout.sessions.create({
      mode,
      line_items: lineItems,
      metadata: {
        type: "store_cart",
        productIds: allProductIds,
      },
      ...(mode === "payment" && { customer_creation: "always" as const }),
      success_url: `${baseUrl}/store/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/store`,
    });

    return { url: session.url };
  } catch (err: any) {
    return { error: err.message || "Something went wrong" };
  }
}
