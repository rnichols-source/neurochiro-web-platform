"use server";

import { stripe } from "@/lib/stripe";
import { STORE_PRODUCTS } from "./store-data";

interface CartLineItem {
  productId: string;
  name: string;
  retailPrice: number; // cents — ignored, looked up server-side
  billing: "one_time" | "monthly";
}

export async function createCartCheckout(items: CartLineItem[]) {
  try {
    if (!items.length) {
      return { error: "Cart is empty" };
    }

    // Server-side price lookup — never trust client prices
    const verifiedItems = items.map((item) => {
      const product = STORE_PRODUCTS.find((p) => p.id === item.productId);
      if (!product) throw new Error(`Product not found: ${item.productId}`);
      return {
        productId: product.id,
        name: product.name,
        retailPrice: product.retailPrice,
        billing: product.billing,
      };
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://neurochiro.co";

    const oneTimeItems = verifiedItems.filter((i) => i.billing === "one_time");
    const recurringItems = verifiedItems.filter((i) => i.billing === "monthly");

    const checkoutItems = recurringItems.length > 0 && oneTimeItems.length > 0
      ? oneTimeItems
      : verifiedItems;

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
