import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY environment variable is not set");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-02-25.clover",
  typescript: true,
});

export const PLANS = {
  doctor: {
    id: "doctor",
    name: "NeuroChiro Doctor Membership",
    monthly: {
      priceId: process.env.STRIPE_DOCTOR_MONTHLY_PRICE_ID ?? "",
      price: 49,
    },
    annual: {
      priceId: process.env.STRIPE_DOCTOR_ANNUAL_PRICE_ID ?? "",
      price: 490,
    },
  },
  student: {
    id: "student",
    name: "NeuroChiro Student Membership",
    monthly: {
      priceId: process.env.STRIPE_STUDENT_MONTHLY_PRICE_ID ?? "",
      price: 9,
    },
    annual: {
      priceId: process.env.STRIPE_STUDENT_ANNUAL_PRICE_ID ?? "",
      price: 90,
    },
  },
};

export function getPriceId(plan: 'doctor' | 'student', cycle: 'monthly' | 'annual'): string {
  return PLANS[plan][cycle].priceId;
}
