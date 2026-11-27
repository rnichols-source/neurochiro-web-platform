import type { Membership } from "./membership.ts";
import {
  formatPlanPrice,
  LIVE_SUBSCRIPTION_STATUSES,
  statusLabel,
  type MembershipSubscription,
} from "../billing/membership-subscription.ts";

export type BillingView = "stripe" | "included" | "included_with_stripe" | "free" | "error";

type SnapshotSubscription = Pick<MembershipSubscription, "status" | "price" | "currency" | "interval" | "intervalCount" | "cancelAtPeriodEnd"> & {
  nextBilling?: string | null;
};

export type BillingSnapshot =
  | null
  | { error?: string; noCustomer?: boolean; subscription?: SnapshotSubscription | null };

type ViewMembership = Pick<Membership, "tier" | "source" | "isFounder">;

function liveSubscription(billing: BillingSnapshot): SnapshotSubscription | null {
  const sub = billing && !billing.error ? billing.subscription : null;
  return sub && LIVE_SUBSCRIPTION_STATUSES.has(sub.status) ? sub : null;
}

/**
 * Stripe is the source of truth for who pays. A live membership subscription in Stripe means
 * "stripe", founding members included. Pro (or founding) on the account with no live
 * subscription means the plan is included at no charge, which is how comped members are told apart.
 */
export function billingView(membership: ViewMembership, billing: BillingSnapshot): BillingView {
  if (!billing || billing.error) return "error";
  if (liveSubscription(billing)) return "stripe";
  const customer = billing.noCustomer !== true;
  const included =
    membership.isFounder ||
    membership.source === "founding" ||
    membership.source === "comped" ||
    membership.tier === "pro" ||
    membership.tier === "neuros";
  if (included && customer) return "included_with_stripe";
  if (included) return "included";
  return "free";
}

export type BillingPlan = {
  view: BillingView;
  /** "Founding member", "Pro", or "Free". */
  planName: string;
  /** Real Stripe price such as "$39/mo" or "£79/mo"; null when nothing is billed. */
  priceLabel: string | null;
  /** Readable Stripe status such as "Active" or "Past due"; null when there is no live subscription. */
  statusLabel: string | null;
  statusTone: "booked" | "follow";
  /** "Renews Dec 01, 2026" or "Ends Nov 30, 2026"; null when Stripe gave no date. */
  dateLabel: string | null;
};

export function billingPlan(membership: ViewMembership, billing: BillingSnapshot): BillingPlan {
  const view = billingView(membership, billing);
  const sub = liveSubscription(billing);
  const founding = membership.isFounder || membership.source === "founding";
  if (view === "stripe" && sub) {
    const date = sub.nextBilling && sub.nextBilling !== "---" ? sub.nextBilling : null;
    return {
      view,
      planName: founding ? "Founding member" : "Pro",
      priceLabel: sub.price > 0 ? formatPlanPrice(sub) : null,
      statusLabel: statusLabel(sub.status),
      statusTone: sub.status === "active" || sub.status === "trialing" ? "booked" : "follow",
      dateLabel: date ? `${sub.cancelAtPeriodEnd ? "Ends" : "Renews"} ${date}` : null,
    };
  }
  return {
    view,
    planName: view === "free" || view === "error" ? "Free" : founding ? "Founding member" : "Pro",
    priceLabel: null,
    statusLabel: null,
    statusTone: "follow",
    dateLabel: null,
  };
}

export function billingNavSubtitle(
  membership: Pick<Membership, "tier" | "source" | "isFounder" | "hasStripeCustomer">,
): string {
  if (membership.hasStripeCustomer) return "Your plan, invoices, payment method";
  const included = membership.isFounder || membership.source === "founding" || membership.source === "comped";
  if (included) return "Your plan";
  return "Upgrade to Pro";
}
