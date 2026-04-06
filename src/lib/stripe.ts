import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const PLANS = {
  starter: {
    id: "starter",
    name: "Starter",
    priceId: process.env.STRIPE_STARTER_PRICE_ID ?? "",
    price: 49,
    canPostJobs: false,
    canManageSeminars: false,
    maxJobPosts: 0,
  },
  growth: {
    id: "growth",
    name: "Growth",
    priceId: process.env.STRIPE_GROWTH_PRICE_ID ?? "",
    price: 99,
    canPostJobs: true,
    canManageSeminars: false,
    maxJobPosts: 5,
  },
  pro: {
    id: "pro",
    name: "Pro",
    priceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
    price: 199,
    canPostJobs: true,
    canManageSeminars: true,
    maxJobPosts: 999,
  },
  SEMINAR_PROMO_TOP: {
    id: process.env.STRIPE_SEMINAR_PROMO_TOP_PRICE_ID ?? "price_seminar_promo_top_mock",
    name: "Seminar Promo Top",
    price: 99,
  }
};
