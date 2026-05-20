"use server";

import { stripe } from "@/lib/stripe";
import { createServerSupabase } from "@/lib/supabase-server";

export async function getSessionDetails(sessionId: string) {
  try {
    // Require authentication
    const supabase = createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to this user (check metadata or email)
    const sessionEmail = session.customer_details?.email;
    if (sessionEmail && sessionEmail !== user.email) return null;

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
      amountTotal: session.amount_total || 0,
    };
  } catch {
    return null;
  }
}
