import Stripe from 'stripe';

// Initialize the Stripe SDK with the secret key from environment variables
// Note: STRIPE_SECRET_KEY is only available on the server-side.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_mock_key', {
  apiVersion: '2026-02-25.clover', // Use the latest API version compatible with your account
  typescript: true,
});

export const PLANS = {
  STUDENT_PREMIUM: {
    id: "price_student_premium_monthly",
    name: "Student Premium (Monthly)",
    price: 3500,
    currency: "usd",
    interval: "month",
  },
  STUDENT_PREMIUM_ANNUAL: {
    id: "price_student_premium_annual",
    name: "Student Premium (Annual)",
    price: 35000,
    currency: "usd",
    interval: "year",
  },
  DOCTOR_MEMBERSHIP: {
    id: "price_doctor_membership_monthly",
    name: "Doctor Membership (Monthly)",
    price: 19900,
    currency: "usd",
    interval: "month",
  },
  DOCTOR_MEMBERSHIP_ANNUAL: {
    id: "price_doctor_membership_annual",
    name: "Doctor Membership (Annual)",
    price: 199000,
    currency: "usd",
    interval: "year",
  },
  MASTERMIND_FULL: {
    id: "price_mastermind_full",
    name: "Clinical Mastermind (Full)",
    price: 250000, // $2,500.00
    currency: "usd",
    interval: "one_time",
  },
  MASTERMIND_PAYMENT_PLAN: {
    id: "price_mastermind_payment_plan",
    name: "Clinical Mastermind (Installment)",
    price: 50000, // $500.00 x 6
    currency: "usd",
    interval: "month",
  },
  COUNCIL_SUBSCRIPTION: {
    id: "price_council_subscription_monthly",
    name: "Council of Elders (Monthly)",
    price: 4900,
    currency: "usd",
    interval: "month",
  },
  COUNCIL_SUBSCRIPTION_ANNUAL: {
    id: "price_council_subscription_annual",
    name: "Council of Elders (Annual)",
    price: 49000,
    currency: "usd",
    interval: "year",
  },
  SEMINAR_PROMO_BASIC: {
    id: "price_seminar_promo_basic",
    name: "Seminar Promotion (Basic)",
    price: 4900,
    currency: "usd",
    interval: "one_time",
  },
  SEMINAR_PROMO_TOP: {
    id: "price_seminar_promo_top",
    name: "Seminar Promotion (Top of Feed)",
    price: 9900,
    currency: "usd",
    interval: "one_time",
  }
};
