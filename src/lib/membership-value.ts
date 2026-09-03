/**
 * SINGLE SOURCE OF TRUTH for the NeuroChiro Network membership value prop.
 * Every page that shows doctor or student features should import from here.
 * Update this file to update ALL pages at once.
 *
 * POSITIONING: NeuroChiro is a NETWORK, not a directory.
 * We PROMOTE practices. We don't just list them.
 * No hardcoded follower counts. Say "our audience" not "185K."
 */

// === DOCTOR PRO ($99/mo) ===

/** The 4 core deliverables — the pitch. Use for booth, first impression, one-liners. */
export const DOCTOR_PRO_CORE = [
  "I promote your practice to our audience every week",
  "Spotlight interview on YouTube + clips for your social",
  "Featured on The Weekly Adjustment live show",
  "Monthly growth report proving it's working",
];

/** Full list — use on pricing page, onboarding gate, detailed views */
export const DOCTOR_PRO_FEATURES_FULL = [
  "Personal onboarding call with Dr. Ray",
  "Your practice promoted to our audience every week",
  "Spotlight interview on YouTube + short-form clips for your social",
  "Featured on The Weekly Adjustment (live every Thursday)",
  "Content about your practice posted in rotation",
  "Patients find you when they search for a nervous system chiropractor",
  "Monthly growth report with views, leads, and city ranking",
  "Full practice tools (analytics, messaging, jobs, ChiroMatch, seminars)",
  "Verified nervous system chiropractor badge",
];

/** Compact list — use on signup pages, cards, limited space */
export const DOCTOR_PRO_FEATURES_COMPACT = [
  "Personal onboarding call with Dr. Ray",
  "Your practice promoted to our audience every week",
  "Spotlight interview on YouTube + video clips",
  "Featured on The Weekly Adjustment (live show)",
  "Content about your practice in rotation",
  "Monthly growth report with stats + city ranking",
  "Patients find you through search + SEO",
  "Full practice tools (analytics, jobs, ChiroMatch)",
];

/** Minimal list — use on gate screens, modals, tight spaces */
export const DOCTOR_PRO_FEATURES_MINIMAL = [
  "Your practice promoted to our audience every week",
  "Spotlight interview on YouTube + video clips for your social",
  "Featured on The Weekly Adjustment (live every Thursday)",
  "Content about your practice posted in rotation",
  "Monthly growth report with stats + city ranking",
  "Full suite of practice tools",
];

/** The guarantee — use on pricing page, onboarding gate */
export const DOCTOR_GUARANTEE = "In your first 60 days, I will personally onboard you, record your spotlight interview, post it to YouTube, create clips for your social, feature you on The Weekly Adjustment, and send you your first growth report. If I don't deliver all of that, your next month is free.";

// === STUDENT ($33/mo) ===

export const STUDENT_FEATURES_FULL = [
  "Personal onboarding call with Dr. Ray",
  "Monthly group call with Dr. Ray",
  "ChiroScore — universal candidate rating (0-100)",
  "ChiroMatch — get matched with top practices",
  "Smart job matching with salary transparency",
  "Academy courses and interview prep",
  "Contract Lab for reviewing offers",
  "Financial planner with salary benchmarks",
  "Direct messaging with doctors and mentors",
];

export const STUDENT_FEATURES_COMPACT = [
  "Personal onboarding call with Dr. Ray",
  "Monthly group call with Dr. Ray",
  "ChiroMatch job matching",
  "Academy courses + interview prep",
  "Contract Lab for reviewing offers",
  "Financial planner with salary data",
  "Direct messaging with doctors",
];

// === PRICING ===

export const PRICING = {
  doctor: {
    monthly: 99,
    annual: 990,
    annualSavings: 198,
    label: "Pro",
  },
  student: {
    monthly: 33,
    label: "Student",
  },
} as const;
