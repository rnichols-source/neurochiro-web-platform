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
  vendor: {
    id: "vendor",
    name: "Vendor Marketplace Partner",
    monthly: {
      priceId: process.env.STRIPE_VENDOR_MONTHLY_PRICE_ID ?? "",
      price: 99,
    },
  },
  seminar_listing: {
    id: "seminar_listing",
    name: "Seminar Listing (Non-Member)",
    oneTime: {
      priceId: process.env.STRIPE_SEMINAR_LISTING_PRICE_ID ?? "",
      price: 199,
    },
  },
  job_listing_30: {
    id: "job_listing_30",
    name: "Job Listing — 30 Days",
    oneTime: {
      priceId: process.env.STRIPE_JOB_30_PRICE_ID ?? "",
      price: 49,
    },
  },
  job_listing_60: {
    id: "job_listing_60",
    name: "Job Listing — 60 Days",
    oneTime: {
      priceId: process.env.STRIPE_JOB_60_PRICE_ID ?? "",
      price: 79,
    },
  },
  job_listing_90: {
    id: "job_listing_90",
    name: "Job Listing — 90 Days",
    oneTime: {
      priceId: process.env.STRIPE_JOB_90_PRICE_ID ?? "",
      price: 99,
    },
  },
} as const;

export function getPriceId(plan: 'doctor' | 'student', cycle: 'monthly' | 'annual'): string {
  return PLANS[plan][cycle].priceId;
}
