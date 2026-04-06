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
    monthly: {
      priceId: process.env.STRIPE_STARTER_MONTHLY_PRICE_ID ?? "",
      price: 49,
    },
    annual: {
      priceId: process.env.STRIPE_STARTER_ANNUAL_PRICE_ID ?? "",
      price: 490,
    },
    canPostJobs: false,
    canManageSeminars: false,
    maxJobPosts: 0,
  },
  growth: {
    id: "growth",
    name: "Growth",
    monthly: {
      priceId: process.env.STRIPE_GROWTH_MONTHLY_PRICE_ID ?? "",
      price: 99,
    },
    annual: {
      priceId: process.env.STRIPE_GROWTH_ANNUAL_PRICE_ID ?? "",
      price: 990,
    },
    canPostJobs: true,
    canManageSeminars: false,
    maxJobPosts: 5,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthly: {
      priceId: process.env.STRIPE_PRO_MONTHLY_PRICE_ID ?? "",
      price: 199,
    },
    annual: {
      priceId: process.env.STRIPE_PRO_ANNUAL_PRICE_ID ?? "",
      price: 1990,
    },
    canPostJobs: true,
    canManageSeminars: true,
    maxJobPosts: 999,
  },
  SEMINAR_PROMO_TOP: {
    id: process.env.STRIPE_SEMINAR_PROMO_TOP_PRICE_ID ?? "",
    name: "Seminar Promo Top",
    price: 99,
  }
};

// Helper to get the right price ID based on billing cycle
export function getPriceId(tier: 'starter' | 'growth' | 'pro', cycle: 'monthly' | 'annual'): string {
  return PLANS[tier][cycle].priceId;
}
