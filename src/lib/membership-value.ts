/**
 * SINGLE SOURCE OF TRUTH for the NeuroChiro Pro membership value prop.
 * Every page that shows doctor or student features should import from here.
 * Update this file to update ALL pages at once.
 */

// === DOCTOR PRO ($99/mo) ===

/** The 4 core deliverables — the pitch. Use for booth, first impression, one-liners. */
export const DOCTOR_PRO_CORE = [
  "Directory listing with SEO — patients find you when they search",
  "The Weekly Adjustment — featured on our live show every Thursday",
  "Spotlight interview on YouTube — chopped into reels for your social",
  "Monthly growth report — views, leads, and city ranking",
];

/** Full list — use on pricing page, onboarding gate, detailed views */
export const DOCTOR_PRO_FEATURES_FULL = [
  "Personal onboarding call with Dr. Ray",
  "Directory listing with SEO driving patients to you",
  "Patient leads forwarded directly to you",
  "Featured on The Weekly Adjustment (live every Thursday 8 PM)",
  "Spotlight interview on YouTube + short-form video clips for your social",
  "Content rotation — your clips and graphics posted to 185K followers",
  "Monthly growth report with views, leads, and city ranking",
  "Full practice tools (analytics, messaging, jobs, ChiroMatch, seminars)",
  "Verified nervous system chiropractor badge",
];

/** Compact list — use on signup pages, cards, limited space */
export const DOCTOR_PRO_FEATURES_COMPACT = [
  "Personal onboarding call with Dr. Ray",
  "Directory listing with SEO driving patients to you",
  "Patient leads forwarded directly to you",
  "Featured on The Weekly Adjustment (live show)",
  "Spotlight interview on YouTube + video clips",
  "Content rotation to 185K followers",
  "Monthly growth report with stats + city ranking",
  "Full practice tools (analytics, jobs, ChiroMatch)",
];

/** Minimal list — use on gate screens, modals, tight spaces */
export const DOCTOR_PRO_FEATURES_MINIMAL = [
  "Patient leads forwarded directly to you",
  "Featured on The Weekly Adjustment (live every Thursday)",
  "Spotlight interview on YouTube + video clips for your social",
  "Content rotation to 185K followers",
  "Monthly growth report with stats + city ranking",
  "Full suite of practice tools",
];

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
