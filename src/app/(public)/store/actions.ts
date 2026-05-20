"use server";

import { stripe } from "@/lib/stripe";
import { STORE_PRODUCTS } from "./store-data";

export async function createStoreCheckout(
  productId: string,
  _productName: string,
  _priceInCents: number,
  _billing: "one_time" | "monthly",
) {
  try {
    // Server-side price lookup — never trust client-provided price
    const product = STORE_PRODUCTS.find((p) => p.id === productId);
    if (!product) {
      return { error: "Product not found" };
    }
    const priceInCents = product.retailPrice;
    const productName = product.name;
    const billing = product.billing;

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
