import { SEMINAR_CONFIG, seminarPriceId, type SeminarPackageId } from "../../config/seminars.ts";

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.neurochiro.co";

export function buildTicketCheckoutSession(input: {
  slug: string;
  title: string;
  ticketName: string;
  currency: string;
  unitAmountCents: number;
  email: string;
  registrationId: string;
  seminarId: string;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const holdSeconds = SEMINAR_CONFIG.seatHoldMinutes * 60;
  return {
    mode: "payment" as const,
    customer_email: input.email,
    client_reference_id: input.registrationId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.unitAmountCents,
          product_data: { name: `${input.title} — ${input.ticketName}` },
        },
      },
    ],
    metadata: {
      type: "seminar_ticket",
      registration_id: input.registrationId,
      seminar_id: input.seminarId,
    },
    success_url: `${SITE}/seminars/${input.slug}/registered?session_id={CHECKOUT_SESSION_ID}&registration=${input.registrationId}`,
    cancel_url: `${SITE}/seminars/${input.slug}?canceled=1`,
    expires_at: Math.floor(now / 1000) + holdSeconds + 120,
  };
}

export function buildPackageCheckoutSession(input: {
  packageId: SeminarPackageId;
  email: string;
  userId: string;
}) {
  const pack = SEMINAR_CONFIG.packages[input.packageId];
  const priceId = seminarPriceId(pack.stripePriceEnv);
  if (!priceId) return { error: "Package pricing is not configured yet." as const };
  const mode = input.packageId === "annual" ? "subscription" as const : "payment" as const;
  return {
    mode,
    customer_email: input.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      type: "seminar_package",
      package_id: input.packageId,
      host_user_id: input.userId,
    },
    subscription_data: mode === "subscription"
      ? { metadata: { type: "seminar_package", package_id: input.packageId, host_user_id: input.userId } }
      : undefined,
    success_url: `${SITE}/doctor/seminars?package=success`,
    cancel_url: `${SITE}/seminars/host?canceled=1`,
  };
}

export function buildFeaturedCheckoutSession(input: {
  seminarId: string;
  slug: string;
  email: string;
  userId: string;
}) {
  const priceId = seminarPriceId(SEMINAR_CONFIG.featuredAddon.stripePriceEnv);
  if (!priceId) return { error: "Featured placement pricing is not configured yet." as const };
  return {
    mode: "payment" as const,
    customer_email: input.email,
    line_items: [{ price: priceId, quantity: 1 }],
    metadata: {
      type: "seminar_featured",
      seminar_id: input.seminarId,
      host_user_id: input.userId,
    },
    success_url: `${SITE}/seminars/${input.slug}?featured=success`,
    cancel_url: `${SITE}/seminars/${input.slug}?canceled=1`,
  };
}
