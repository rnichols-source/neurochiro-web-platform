/**
 * SINGLE SOURCE OF TRUTH for the NeuroChiro Pro membership value prop.
 * Every page that shows doctor or student features should import from here.
 * Update this file to update ALL pages at once.
 */

// === DOCTOR PRO ($99/mo) ===

/** Full list — use on pricing page, onboarding gate, detailed views */
export const DOCTOR_PRO_FEATURES_FULL = [
  "Personal onboarding call with Dr. Ray",
  "Directory listing with SEO driving patients to you",
  "Patient leads forwarded directly to you",
  "Monthly branded content kit (graphics + reels with your name and city)",
  "Instagram Collab posts to 185K followers",
  "Featured on weekly live stream (IG + YouTube)",
  "Spotlight interview on YouTube + short-form video clips for your social",
  "City spotlight weeks (concentrated regional promotion)",
  "SEO city articles featuring you by name on neurochiro.co",
  "Patient search alerts tagging you when patients search your city",
  "Find Your Chiropractor quiz routing patients to your profile",
  "Patient win story amplification across all channels",
  "Member referral shoutouts (refer a doctor, both get featured)",
  "Monthly growth report with views, leads, and city ranking",
  "Full practice tools (analytics, messaging, jobs, ChiroMatch, seminars)",
  "Verified nervous system chiropractor badge",
];

/** Compact list — use on signup pages, cards, limited space */
export const DOCTOR_PRO_FEATURES_COMPACT = [
  "Personal onboarding call with Dr. Ray",
  "Directory listing with SEO driving patients to you",
  "Patient leads forwarded directly to you",
  "Monthly branded content kit for your social",
  "Instagram Collab posts (185K followers)",
  "Featured on weekly live stream (IG + YouTube)",
  "Spotlight interview on YouTube + short-form video clips",
  "City spotlight weeks + SEO articles featuring you",
  "Monthly growth report with stats + city ranking",
  "Full practice tools (analytics, jobs, ChiroMatch)",
];

/** Minimal list — use on gate screens, modals, tight spaces */
export const DOCTOR_PRO_FEATURES_MINIMAL = [
  "Patient leads forwarded directly to you",
  "Monthly branded content kit for your social",
  "Featured on weekly live stream (IG + YouTube)",
  "Spotlight interview on YouTube + short-form video clips",
  "Instagram Collab posts to 185K followers",
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
