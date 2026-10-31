import type { Membership } from "./membership.ts";

export type BillingView = "stripe" | "included" | "included_with_stripe" | "free" | "error";

export type BillingSnapshot =
  | null
  | { error?: string; noCustomer?: boolean };

export function billingView(
  membership: Pick<Membership, "tier" | "source" | "isFounder">,
  billing: BillingSnapshot,
): BillingView {
  if (!billing || billing.error) return "error";
  const included = membership.isFounder || membership.source === "founding" || membership.source === "comped";
  const customer = billing.noCustomer !== true;
  if (included && customer) return "included_with_stripe";
  if (included) return "included";
  if (customer) return "stripe";
  if (membership.tier === "free") return "free";
  return "error";
}

export function billingNavSubtitle(
  membership: Pick<Membership, "tier" | "source" | "isFounder" | "hasStripeCustomer">,
): string {
  if (membership.hasStripeCustomer) return "Your plan, invoices, payment method";
  const included = membership.isFounder || membership.source === "founding" || membership.source === "comped";
  if (included) return "Your plan";
  return "Upgrade to Pro";
}
