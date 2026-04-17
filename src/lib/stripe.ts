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
  // Academy Courses (one-time purchases)
  course_clinical_identity: {
    id: "course_clinical_identity",
    name: "Building Your Clinical Identity",
    oneTime: {
      priceId: process.env.STRIPE_COURSE_CLINICAL_IDENTITY_PRICE_ID ?? "",
      price: 29,
    },
  },
  course_business: {
    id: "course_business",
    name: "The Business of Chiropractic",
    oneTime: {
      priceId: process.env.STRIPE_COURSE_BUSINESS_PRICE_ID ?? "",
      price: 39,
    },
  },
  course_clinical_confidence: {
    id: "course_clinical_confidence",
    name: "Clinical Confidence",
    oneTime: {
      priceId: process.env.STRIPE_COURSE_CLINICAL_CONFIDENCE_PRICE_ID ?? "",
      price: 39,
    },
  },
  course_associate_playbook: {
    id: "course_associate_playbook",
    name: "The Associate Playbook",
    oneTime: {
      priceId: process.env.STRIPE_COURSE_ASSOCIATE_PLAYBOOK_PRICE_ID ?? "",
      price: 49,
    },
  },
  course_bundle: {
    id: "course_bundle",
    name: "School-to-Practice System (All 4 Courses)",
    oneTime: {
      priceId: process.env.STRIPE_COURSE_BUNDLE_PRICE_ID ?? "",
      price: 99,
    },
  },
  // Contract Templates
  contract_bundle: {
    id: "contract_bundle",
    name: "Complete Contract Templates Bundle",
    oneTime: {
      priceId: process.env.STRIPE_CONTRACT_BUNDLE_PRICE_ID ?? "",
      price: 99,
    },
  },
  contract_employment: {
    id: "contract_employment",
    name: "Employment Agreement Template",
    oneTime: {
      priceId: process.env.STRIPE_CONTRACT_EMPLOYMENT_PRICE_ID ?? "",
      price: 49,
    },
  },
  contract_standard: {
    id: "contract_standard",
    name: "Contract Template (Standard)",
    oneTime: {
      priceId: process.env.STRIPE_CONTRACT_STANDARD_PRICE_ID ?? "",
      price: 39,
    },
  },
  contract_basic: {
    id: "contract_basic",
    name: "Contract Template (Basic)",
    oneTime: {
      priceId: process.env.STRIPE_CONTRACT_BASIC_PRICE_ID ?? "",
      price: 29,
    },
  },
  // KPI Tracker
  kpi_tracker: {
    id: "kpi_tracker",
    name: "KPI Tracker",
    monthly: {
      priceId: process.env.STRIPE_KPI_TRACKER_PRICE_ID ?? "",
      price: 29,
    },
  },
  // Content Library Add-on
  content_library: {
    id: "content_library",
    name: "Patient Education Content Library",
    monthly: {
      priceId: process.env.STRIPE_CONTENT_LIBRARY_PRICE_ID ?? "",
      price: 29,
    },
  },
} as const;

export function getPriceId(plan: 'doctor' | 'student', cycle: 'monthly' | 'annual'): string {
  return PLANS[plan][cycle].priceId;
}
