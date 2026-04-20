"use server";

import { stripe } from "@/lib/stripe";

export async function getSessionDetails(sessionId: string) {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    const metadata = session.metadata || {};
    const productIds: string[] = [];

    if (metadata.productId) {
      productIds.push(metadata.productId);
    }
    if (metadata.productIds) {
      productIds.push(...metadata.productIds.split(",").filter(Boolean));
    }

    return {
      productIds,
      email: session.customer_details?.email || null,
      amountTotal: session.amount_total || 0,
    };
  } catch {
    return null;
  }
}
