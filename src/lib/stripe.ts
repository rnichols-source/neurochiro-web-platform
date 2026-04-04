import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const PLANS = {
  free: {
    id: "free",
    name: "Free",
    priceId: null,
    price: 0,
    canPostJobs: false,
    canManageSeminars: false,
    maxJobPosts: 0,
  },
  pro: {
    id: "pro",
    name: "Doctor Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    price: 199,
    canPostJobs: true,
    canManageSeminars: false,
    maxJobPosts: 2,
  },
  elite: {
    id: "elite",
    name: "Elite Clinic",
    priceId: process.env.STRIPE_ELITE_PRICE_ID ?? "",
    price: 499,
    canPostJobs: true,
    canManageSeminars: true,
    maxJobPosts: 999,
  },
  // Additional promotional plans used in the app
  SEMINAR_PROMO_TOP: {
    id: process.env.STRIPE_SEMINAR_PROMO_TOP_PRICE_ID ?? "price_seminar_promo_top_mock",
    name: "Seminar Promo Top",
    price: 99,
  }
};
